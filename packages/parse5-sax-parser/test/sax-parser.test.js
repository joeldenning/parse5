import assert from 'node:assert';
import * as fs from 'node:fs';
import { SAXParser } from '../lib/index.js';
import { loadSAXParserTestData } from '../../../test/utils/load-sax-parser-test-data.js';
import {
    getStringDiffMsg,
    writeChunkedToStream,
    removeNewLines,
    WritableStreamStub,
} from '../../../test/utils/common.js';

function sanitizeForComparison(str) {
    return removeNewLines(str).replace(/\s/g, '').replace(/'/g, '"').toLowerCase();
}

function createBasicTest(html, expected, options) {
    return function () {
        //NOTE: the idea of the test is to serialize back given HTML using SAXParser handlers
        let actual = '';
        const parser = new SAXParser(options);

        parser.on('doctype', ({ name, publicId, systemId }) => {
            actual += `<!DOCTYPE ${name}`;

            if (publicId !== null) {
                actual += ` PUBLIC "${publicId}"`;
            } else if (systemId !== null) {
                actual += ' SYSTEM';
            }

            if (systemId !== null) {
                actual += ` "${systemId}"`;
            }

            actual += '>';
        });

        parser.on('startTag', ({ tagName, attrs, selfClosing }) => {
            actual += `<${tagName}`;

            if (attrs.length > 0) {
                for (let i = 0; i < attrs.length; i++) {
                    actual += ` ${attrs[i].name}="${attrs[i].value}"`;
                }
            }

            actual += selfClosing ? '/>' : '>';
        });

        parser.on('endTag', ({ tagName }) => {
            actual += `</${tagName}>`;
        });

        parser.on('text', ({ text }) => {
            actual += text;
        });

        parser.on('comment', ({ text }) => {
            actual += `<!--${text}-->`;
        });

        parser.once('finish', () => {
            expected = sanitizeForComparison(expected);
            actual = sanitizeForComparison(actual);

            //NOTE: use ok assertion, so output will not be polluted by the whole content of the strings
            assert.ok(actual === expected, getStringDiffMsg(actual, expected));
        });

        writeChunkedToStream(html, parser);
    };
}

const hugePage = new URL('../../../test/data/huge-page/huge-page.html', import.meta.url);

suite('SAX parser', () => {
    //Basic tests
    for (const [idx, data] of loadSAXParserTestData().entries()) {
        test(`${idx + 1}.${data.name}`, createBasicTest(data.src, data.expected, data.options));
    }

    test('Piping and .stop()', (done) => {
        const parser = new SAXParser();
        const writable = new WritableStreamStub();
        let handlerCallCount = 0;

        const handler = function () {
            handlerCallCount++;

            if (handlerCallCount === 10) {
                parser.stop();
            }
        };

        fs.createReadStream(hugePage, 'utf8').pipe(parser).pipe(writable);

        parser.on('startTag', handler);
        parser.on('endTag', handler);
        parser.on('doctype', handler);
        parser.on('comment', handler);
        parser.on('text', handler);

        writable.once('finish', () => {
            const expected = fs.readFileSync(hugePage).toString();

            assert.strictEqual(handlerCallCount, 10);
            assert.strictEqual(writable.writtenData, expected);
            done();
        });
    });

    test('Parser silently exits on big files (GH-97)', (done) => {
        const parser = new SAXParser();

        fs.createReadStream(hugePage, 'utf8').pipe(parser);

        //NOTE: This is a smoke test - in case of regression it will fail with timeout.
        parser.once('finish', done);
    });

    test('Last text chunk must be flushed (GH-271)', (done) => {
        const parser = new SAXParser();
        let foundText = false;

        parser.on('text', ({ text }) => {
            foundText = true;
            assert.strictEqual(text, 'text');
        });

        parser.once('finish', () => {
            assert.ok(foundText);
            done();
        });

        parser.write('text');
        parser.end();
    });

    test('Should not accept binary input (GH-269)', () => {
        const stream = new SAXParser();
        const buf = Buffer.from('test');

        assert.throws(() => stream.write(buf), TypeError);
    });
});
