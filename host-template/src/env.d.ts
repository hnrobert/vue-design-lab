/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

/* Explicit asset declarations: the Vue ts-plugin sometimes ignores the
   `types: ["vite/client"]` field for .vue files, leaving image imports
   red in the editor even though vue-tsc passes. Declaring them here keeps
   both worlds green. */
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.jpeg' {
  const src: string
  export default src
}
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}
declare module '*.webp' {
  const src: string
  export default src
}
