// Tillad import af CSS- og CSS-module-filer i TypeScript.
declare module '*.css';

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
