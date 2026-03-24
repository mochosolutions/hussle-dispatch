/**
 * Custom ts-jest AST transformer that replaces `import.meta.env` references
 * with `process.env` so Jest can parse Vite-style environment access.
 *
 * This is necessary because `import.meta` is not available in the Node/Jest
 * runtime when using ts-jest (CommonJS transform).
 */
import type { TsCompilerInstance } from 'ts-jest';
import ts from 'typescript';

const importMetaEnvTransformer = (
  _program: ts.Program | undefined,
  _config: { compilerModule: typeof ts },
): ts.TransformerFactory<ts.SourceFile> =>
  (context: ts.TransformationContext) =>
  (sourceFile: ts.SourceFile): ts.SourceFile => {
    const visitor = (node: ts.Node): ts.Node => {
      // Match `import.meta.env.<PROP>` → `process.env.<PROP>`
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isMetaProperty(node.expression.expression) &&
        node.expression.name.text === 'env'
      ) {
        return ts.factory.createPropertyAccessExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('process'),
            ts.factory.createIdentifier('env'),
          ),
          node.name,
        );
      }

      // Match `import.meta.env` (without a trailing property)
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isMetaProperty(node.expression) &&
        node.name.text === 'env'
      ) {
        return ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('process'),
          ts.factory.createIdentifier('env'),
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };

/** ts-jest expects a named export `factory` that receives the compiler instance */
export const factory = (compilerInstance: TsCompilerInstance) =>
  importMetaEnvTransformer(undefined, { compilerModule: compilerInstance.compilerModule });

export const name = 'import-meta-env-transformer';
export const version = '1.0.0';
