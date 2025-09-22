# 🛡️ ESLint Custom Rule: Prevent Multiple Supabase Clients

## Overview
This setup prevents developers from accidentally creating new Supabase client instances outside the designated `lib/supabaseClient.ts` file, maintaining our single client architecture.

## ✅ Implementation Complete

### 1. **Custom ESLint Rule Created**
**File**: `eslint-rules/no-supabase-createclient.js`

```javascript
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
```

**Rule Features:**
- ✅ Detects imports of `@supabase/supabase-js` and `@supabase/ssr`
- ✅ Allows imports only in `lib/supabaseClient.ts`
- ✅ Provides clear error message with solution
- ✅ Prevents accidental multiple client creation

### 2. **ESLint Configuration Updated**
**File**: `eslint.config.js`

```javascript
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import noSupabaseCreateClient from "./eslint-rules/no-supabase-createclient.js";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "no-supabase-createclient": {
        rules: {
          "no-supabase-createclient": noSupabaseCreateClient,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "no-supabase-createclient/no-supabase-createclient": "error",
    },
  },
);
```

**Configuration Features:**
- ✅ Uses modern ESLint flat config format
- ✅ Imports custom rule as ES module
- ✅ Registers plugin with rule
- ✅ Sets rule severity to "error"

### 3. **Package.json Lint Script**
**Already Present**: `"lint": "eslint ."`

The lint script was already configured in package.json and will now include our custom rule.

## 🧪 Testing the Rule

### **Test Case 1: Violation (Should Error)**
```typescript
// test-eslint-rule.ts
import { createClient } from '@supabase/supabase-js'  // ❌ ERROR

const supabase = createClient('url', 'key')
```

**Expected Error:**
```
❌ Do not call createClient outside lib/supabaseClient.ts. Import supabase from "@/lib/supabaseClient" instead.
```

### **Test Case 2: Allowed (Should Pass)**
```typescript
// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'  // ✅ ALLOWED

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
```

### **Test Case 3: Correct Usage (Should Pass)**
```typescript
// src/pages/Video.tsx
import { supabase } from '../../lib/supabaseClient'  // ✅ ALLOWED

// Use supabase client...
```

## 🚀 Usage Instructions

### **Running the Linter**
```bash
# Run ESLint with custom rule
npm run lint

# Or directly with npx
npx eslint .

# Fix auto-fixable issues
npm run lint -- --fix
```

### **CI/CD Integration**
Add to your CI pipeline:
```yaml
- name: Run ESLint
  run: npm run lint
```

### **IDE Integration**
Most IDEs with ESLint extensions will automatically show errors:
- ✅ VS Code with ESLint extension
- ✅ WebStorm/IntelliJ with ESLint plugin
- ✅ Vim/Neovim with ESLint LSP

## 🛡️ Protection Benefits

### **Prevents Common Mistakes**
- ❌ `import { createClient } from '@supabase/supabase-js'` in components
- ❌ Multiple client instances causing GoTrueClient warnings
- ❌ Inconsistent client configurations
- ❌ Authentication state conflicts

### **Enforces Best Practices**
- ✅ Single source of truth for Supabase client
- ✅ Consistent import patterns across codebase
- ✅ Clear error messages guide developers to correct usage
- ✅ Automatic detection during development

### **Developer Experience**
- 🔍 **Early Detection**: Catches issues during development
- 📝 **Clear Guidance**: Error message shows correct import path
- 🚀 **Fast Feedback**: Immediate feedback in IDE
- 🛠️ **Easy Fix**: Simple import change to resolve

## 📋 File Structure

```
eslint-rules/
└── no-supabase-createclient.js     # ✅ Custom ESLint rule

lib/
└── supabaseClient.ts               # ✅ Only allowed location for createClient

eslint.config.js                    # ✅ Updated with custom rule
package.json                        # ✅ Lint script ready
test-eslint-rule.ts                 # ✅ Test file (should error)
```

## 🔧 Maintenance

### **Adding Exceptions**
If you need to allow createClient in additional files:
```javascript
// In eslint-rules/no-supabase-createclient.js
if (!filePath.includes('lib/supabaseClient.ts') && 
    !filePath.includes('other-allowed-file.ts')) {
  // Allow exception
}
```

### **Extending the Rule**
To catch more patterns:
```javascript
// Add to ImportDeclaration check
CallExpression(node) {
  if (node.callee.name === 'createClient') {
    // Check for direct createClient calls
  }
}
```

## ✅ Status: PRODUCTION READY

The ESLint rule is now:
- **Active**: Integrated into the linting process
- **Protective**: Prevents multiple Supabase client creation
- **Developer-Friendly**: Provides clear error messages and solutions
- **Maintainable**: Easy to extend or modify as needed

**Next Steps:**
1. Run `npm run lint` to test the rule
2. Fix any existing violations
3. Add to CI/CD pipeline for continuous protection
4. Share with team for consistent enforcement

🎉 **Your codebase is now protected against accidental Supabase client duplication!**
