import { visit } from 'unist-util-visit';

export default function remarkPreserveCodeMeta() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (node.meta) {
        node.data = node.data || {};
        node.data.hProperties = node.data.hProperties || {};
        node.data.hProperties.dataMeta = node.meta;
      }
    });
  };
}
