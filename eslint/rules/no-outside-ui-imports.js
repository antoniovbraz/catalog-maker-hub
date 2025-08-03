import path from 'path';

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow direct imports of lucide-react or @radix-ui outside src/components/ui',
    },
    messages: {
      restricted: 'Direct imports from "{{module}}" are only allowed within src/components/ui.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const relative = path.relative(process.cwd(), filename);
    const uiPath = path.join('src', 'components', 'ui');
    if (relative.startsWith(uiPath)) {
      return {};
    }
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        if (importPath === 'lucide-react' || importPath.startsWith('@radix-ui')) {
          context.report({ node: node.source, messageId: 'restricted', data: { module: importPath } });
        }
      },
    };
  },
};

export default {
  rules: {
    'no-outside-ui-imports': rule,
  },
};
