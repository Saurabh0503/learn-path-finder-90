/**
 * ESLint Rule: no-supabase-createclient
 * Disallow using createClient outside lib/supabaseClient.ts
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct use of createClient except in lib/supabaseClient.ts',
    },
    schema: [],
    messages: {
      noCreateClient:
        'Do not call createClient outside lib/supabaseClient.ts. Import supabase from "@/lib/supabaseClient" instead.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (
          node.source.value === '@supabase/supabase-js' ||
          node.source.value === '@supabase/ssr'
        ) {
          const filePath = context.getFilename()
          if (!filePath.includes('lib/supabaseClient.ts')) {
            context.report({
              node,
              messageId: 'noCreateClient',
            })
          }
        }
      },
    }
  },
}
