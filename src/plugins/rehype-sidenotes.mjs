import { visit, SKIP } from 'unist-util-visit';

const SIDENOTE_REF_RE = /\(\((\d+)\)\)/g;

function inlineMarkdownToHtml(md) {
  return md
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function textNode(value) {
  return { type: 'text', value };
}

function supRefNode(num) {
  return {
    type: 'element',
    tagName: 'sup',
    properties: {
      className: ['sidenote-ref'],
      dataNote: String(num),
      role: 'doc-noteref',
      ariaDescribedby: `sidenote-${num}`,
      tabIndex: 0,
    },
    children: [textNode(String(num))],
  };
}

export default function rehypeSidenotes() {
  return (tree) => {
    const sidenotes = new Map();
    const referencedNums = new Set();

    // Pass 1: Collect sidenote code blocks, remove from tree
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre') return;
      const code = node.children?.[0];
      if (!code || code.tagName !== 'code') return;

      const classes = code.properties?.className || [];
      if (!classes.some(c => c === 'language-sidenote')) return;

      const meta = code.properties?.dataMeta;
      if (!meta) return;

      const num = parseInt(meta.trim(), 10);
      if (isNaN(num)) return;

      const content = (code.children || [])
        .map(c => c.value || '')
        .join('')
        .replace(/\n$/, '');
      sidenotes.set(num, content);
      parent.children.splice(index, 1);
      return [SKIP, index];
    });

    if (sidenotes.size === 0) return;

    // Pass 2: Transform ((N)) in text nodes
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || !Array.isArray(parent.children)) return;
      if (!SIDENOTE_REF_RE.test(node.value)) return;
      SIDENOTE_REF_RE.lastIndex = 0;

      const parts = [];
      let lastIdx = 0;
      let match;
      while ((match = SIDENOTE_REF_RE.exec(node.value)) !== null) {
        if (match.index > lastIdx) {
          parts.push(textNode(node.value.slice(lastIdx, match.index)));
        }
        const num = parseInt(match[1], 10);
        referencedNums.add(num);
        parts.push(supRefNode(num));
        lastIdx = SIDENOTE_REF_RE.lastIndex;
      }
      if (lastIdx < node.value.length) {
        parts.push(textNode(node.value.slice(lastIdx)));
      }
      parent.children.splice(index, 1, ...parts);
      return [SKIP, index + parts.length];
    });

    // Pass 3: Inject sidenote container (only referenced sidenotes — orphans filtered)
    const sorted = [...sidenotes.entries()]
      .filter(([num]) => referencedNums.has(num))
      .sort((a, b) => a[0] - b[0]);

    if (sorted.length === 0) return;

    const asideElements = sorted.map(([num, content]) => ({
      type: 'element',
      tagName: 'aside',
      properties: {
        className: ['sidenote'],
        id: `sidenote-${num}`,
        dataNote: String(num),
        role: 'doc-footnote',
        ariaLabel: `Sidenote ${num}`,
      },
      children: [
        {
          type: 'element',
          tagName: 'sup',
          properties: { className: ['sidenote-label'] },
          children: [textNode(String(num))],
        },
        textNode(' '),
        { type: 'raw', value: inlineMarkdownToHtml(content) },
      ],
    }));

    const containerNode = {
      type: 'element',
      tagName: 'div',
      properties: { className: ['sidenotes-container'] },
      children: asideElements,
    };

    // Append to body (last element in tree)
    const body = tree.children?.find(n => n.tagName === 'body') || tree;
    (body.children || tree.children).push(containerNode);
  };
}
