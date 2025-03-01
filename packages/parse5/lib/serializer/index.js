import * as defaultTreeAdapter from '../tree-adapters/default.js';
import { mergeOptions } from '../utils/merge-options.js';
import * as doctype from '../common/doctype.js';
import * as HTML from '../common/html.js';

//Aliases
const $ = HTML.TAG_NAMES;
const NS = HTML.NAMESPACES;

//Default serializer options
const DEFAULT_OPTIONS = {
    treeAdapter: defaultTreeAdapter,
};

//Escaping regexes
const AMP_REGEX = /&/g;
const NBSP_REGEX = /\u00A0/g;
const DOUBLE_QUOTE_REGEX = /"/g;
const LT_REGEX = /</g;
const GT_REGEX = />/g;

//Serializer
export class Serializer {
    constructor(node, options) {
        this.options = mergeOptions(DEFAULT_OPTIONS, options);
        this.treeAdapter = this.options.treeAdapter;

        this.html = '';
        this.startNode = node;
    }

    //API
    serialize() {
        this._serializeChildNodes(this.startNode);

        return this.html;
    }

    //Internals
    _serializeChildNodes(parentNode) {
        const childNodes = this.treeAdapter.getChildNodes(parentNode);

        if (childNodes) {
            for (let i = 0, cnLength = childNodes.length; i < cnLength; i++) {
                const currentNode = childNodes[i];

                if (this.treeAdapter.isElementNode(currentNode)) {
                    this._serializeElement(currentNode);
                } else if (this.treeAdapter.isTextNode(currentNode)) {
                    this._serializeTextNode(currentNode);
                } else if (this.treeAdapter.isCommentNode(currentNode)) {
                    this._serializeCommentNode(currentNode);
                } else if (this.treeAdapter.isDocumentTypeNode(currentNode)) {
                    this._serializeDocumentTypeNode(currentNode);
                }
            }
        }
    }

    _serializeElement(node) {
        const tn = this.treeAdapter.getTagName(node);
        const ns = this.treeAdapter.getNamespaceURI(node);

        this.html += `<${tn}`;
        this._serializeAttributes(node);
        this.html += '>';

        if (
            tn !== $.AREA &&
            tn !== $.BASE &&
            tn !== $.BASEFONT &&
            tn !== $.BGSOUND &&
            tn !== $.BR &&
            tn !== $.COL &&
            tn !== $.EMBED &&
            tn !== $.FRAME &&
            tn !== $.HR &&
            tn !== $.IMG &&
            tn !== $.INPUT &&
            tn !== $.KEYGEN &&
            tn !== $.LINK &&
            tn !== $.META &&
            tn !== $.PARAM &&
            tn !== $.SOURCE &&
            tn !== $.TRACK &&
            tn !== $.WBR
        ) {
            const childNodesHolder =
                tn === $.TEMPLATE && ns === NS.HTML ? this.treeAdapter.getTemplateContent(node) : node;

            this._serializeChildNodes(childNodesHolder);
            this.html += `</${tn}>`;
        }
    }

    _serializeAttributes(node) {
        const attrs = this.treeAdapter.getAttrList(node);

        for (let i = 0, attrsLength = attrs.length; i < attrsLength; i++) {
            const attr = attrs[i];
            const value = escapeString(attr.value, true);

            this.html += ' ';

            if (!attr.namespace) {
                this.html += attr.name;
            } else {
                switch (attr.namespace) {
                    case NS.XML: {
                        this.html += `xml:${attr.name}`;

                        break;
                    }
                    case NS.XMLNS: {
                        if (attr.name !== 'xmlns') {
                            this.html += 'xmlns:';
                        }

                        this.html += attr.name;

                        break;
                    }
                    case NS.XLINK: {
                        this.html += `xlink:${attr.name}`;

                        break;
                    }
                    default: {
                        this.html += `${attr.prefix}:${attr.name}`;
                    }
                }
            }

            this.html += `="${value}"`;
        }
    }

    _serializeTextNode(node) {
        const content = this.treeAdapter.getTextNodeContent(node);
        const parent = this.treeAdapter.getParentNode(node);
        let parentTn = void 0;

        if (parent && this.treeAdapter.isElementNode(parent)) {
            parentTn = this.treeAdapter.getTagName(parent);
        }

        this.html +=
            parentTn === $.STYLE ||
            parentTn === $.SCRIPT ||
            parentTn === $.XMP ||
            parentTn === $.IFRAME ||
            parentTn === $.NOEMBED ||
            parentTn === $.NOFRAMES ||
            parentTn === $.PLAINTEXT ||
            parentTn === $.NOSCRIPT
                ? content
                : escapeString(content, false);
    }

    _serializeCommentNode(node) {
        this.html += `<!--${this.treeAdapter.getCommentNodeContent(node)}-->`;
    }

    _serializeDocumentTypeNode(node) {
        const name = this.treeAdapter.getDocumentTypeNodeName(node);

        this.html += `<${doctype.serializeContent(name, null, null)}>`;
    }
}

// NOTE: used in tests and by rewriting stream
export function escapeString(str, attrMode) {
    str = str.replace(AMP_REGEX, '&amp;').replace(NBSP_REGEX, '&nbsp;');

    str = attrMode
        ? str.replace(DOUBLE_QUOTE_REGEX, '&quot;')
        : str.replace(LT_REGEX, '&lt;').replace(GT_REGEX, '&gt;');

    return str;
}
