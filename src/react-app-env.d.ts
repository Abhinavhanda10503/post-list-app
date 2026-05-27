// src/types/css.d.ts or src/react-app-env.d.ts
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}