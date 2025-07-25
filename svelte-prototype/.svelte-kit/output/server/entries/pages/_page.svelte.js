import { c as create_ssr_component, f as add_attribute, e as escape, v as validate_component } from "../../chunks/ssr.js";
const css$3 = {
  code: ".card.svelte-11vrzpo{background:var(--color-bg-primary);border:1px solid var(--color-gray-200);border-radius:12px;transition:all 0.2s ease}.card-interactive.svelte-11vrzpo:hover{box-shadow:0 4px 12px rgba(0, 0, 0, 0.1);transform:translateY(-1px)}.card-primary.svelte-11vrzpo{border-color:var(--color-primary-light);background:linear-gradient(135deg, var(--color-primary-pale) 0%, var(--color-bg-primary) 100%)}.card-success.svelte-11vrzpo{border-color:var(--color-success);background:linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, var(--color-bg-primary) 100%)}.card-warning.svelte-11vrzpo{border-color:var(--color-warning);background:linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, var(--color-bg-primary) 100%)}.card-sm.svelte-11vrzpo{padding:var(--space-4)}.card-md.svelte-11vrzpo{padding:var(--space-6)}.card-lg.svelte-11vrzpo{padding:var(--space-8)}",
  map: `{"version":3,"file":"Card.svelte","sources":["Card.svelte"],"sourcesContent":["<script lang=\\"ts\\">\\n  export let variant = 'default';\\n  export let padding = 'md';\\n  export let interactive = false;\\n<\/script>\\n\\n<div \\n  class=\\"card\\"\\n  class:card-default={variant === 'default'}\\n  class:card-primary={variant === 'primary'}\\n  class:card-success={variant === 'success'}\\n  class:card-warning={variant === 'warning'}\\n  class:card-sm={padding === 'sm'}\\n  class:card-md={padding === 'md'}\\n  class:card-lg={padding === 'lg'}\\n  class:card-interactive={interactive}\\n>\\n  <slot />\\n</div>\\n\\n<style>\\n  .card {\\n    background: var(--color-bg-primary);\\n    border: 1px solid var(--color-gray-200);\\n    border-radius: 12px;\\n    transition: all 0.2s ease;\\n  }\\n  \\n  .card-interactive:hover {\\n    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\\n    transform: translateY(-1px);\\n  }\\n  \\n  .card-primary {\\n    border-color: var(--color-primary-light);\\n    background: linear-gradient(135deg, var(--color-primary-pale) 0%, var(--color-bg-primary) 100%);\\n  }\\n  \\n  .card-success {\\n    border-color: var(--color-success);\\n    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, var(--color-bg-primary) 100%);\\n  }\\n  \\n  .card-warning {\\n    border-color: var(--color-warning);\\n    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, var(--color-bg-primary) 100%);\\n  }\\n  \\n  .card-sm { padding: var(--space-4); }\\n  .card-md { padding: var(--space-6); }\\n  .card-lg { padding: var(--space-8); }\\n</style>"],"names":[],"mappings":"AAqBE,oBAAM,CACJ,UAAU,CAAE,IAAI,kBAAkB,CAAC,CACnC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,gBAAgB,CAAC,CACvC,aAAa,CAAE,IAAI,CACnB,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IACvB,CAEA,gCAAiB,MAAO,CACtB,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACzC,SAAS,CAAE,WAAW,IAAI,CAC5B,CAEA,4BAAc,CACZ,YAAY,CAAE,IAAI,qBAAqB,CAAC,CACxC,UAAU,CAAE,gBAAgB,MAAM,CAAC,CAAC,IAAI,oBAAoB,CAAC,CAAC,EAAE,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,IAAI,CAChG,CAEA,4BAAc,CACZ,YAAY,CAAE,IAAI,eAAe,CAAC,CAClC,UAAU,CAAE,gBAAgB,MAAM,CAAC,CAAC,KAAK,EAAE,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,EAAE,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,IAAI,CAC9F,CAEA,4BAAc,CACZ,YAAY,CAAE,IAAI,eAAe,CAAC,CAClC,UAAU,CAAE,gBAAgB,MAAM,CAAC,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,EAAE,CAAC,CAAC,GAAG,CAAC,CAAC,EAAE,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAAC,IAAI,CAC9F,CAEA,uBAAS,CAAE,OAAO,CAAE,IAAI,SAAS,CAAG,CACpC,uBAAS,CAAE,OAAO,CAAE,IAAI,SAAS,CAAG,CACpC,uBAAS,CAAE,OAAO,CAAE,IAAI,SAAS,CAAG"}`
};
const Card = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { variant = "default" } = $$props;
  let { padding = "md" } = $$props;
  let { interactive = false } = $$props;
  if ($$props.variant === void 0 && $$bindings.variant && variant !== void 0) $$bindings.variant(variant);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.interactive === void 0 && $$bindings.interactive && interactive !== void 0) $$bindings.interactive(interactive);
  $$result.css.add(css$3);
  return `<div class="${[
    "card svelte-11vrzpo",
    (variant === "default" ? "card-default" : "") + " " + (variant === "primary" ? "card-primary" : "") + " " + (variant === "success" ? "card-success" : "") + " " + (variant === "warning" ? "card-warning" : "") + " " + (padding === "sm" ? "card-sm" : "") + " " + (padding === "md" ? "card-md" : "") + " " + (padding === "lg" ? "card-lg" : "") + " " + (interactive ? "card-interactive" : "")
  ].join(" ").trim()}">${slots.default ? slots.default({}) : ``} </div>`;
});
const css$2 = {
  code: ".btn.svelte-1etan63{display:inline-flex;align-items:center;justify-content:center;font-weight:500;border-radius:8px;border:none;cursor:pointer;transition:all 0.2s ease;text-decoration:none;font-family:inherit}.btn.svelte-1etan63:disabled,.btn-disabled.svelte-1etan63{opacity:0.5;cursor:not-allowed}.btn-full.svelte-1etan63{width:100%}.btn-primary.svelte-1etan63{background:var(--color-primary);color:white}.btn-primary.svelte-1etan63:hover:not(:disabled){background:var(--color-primary-hover)}.btn-secondary.svelte-1etan63{background:var(--color-gray-100);color:var(--color-gray-700);border:1px solid var(--color-gray-200)}.btn-secondary.svelte-1etan63:hover:not(:disabled){background:var(--color-gray-200)}.btn-ghost.svelte-1etan63{background:transparent;color:var(--color-primary)}.btn-ghost.svelte-1etan63:hover:not(:disabled){background:var(--color-primary-pale)}.btn-success.svelte-1etan63{background:#059669;color:white}.btn-success.svelte-1etan63:hover:not(:disabled){background:#047857}.btn-disabled-variant.svelte-1etan63{background:#9ca3af;color:white;cursor:not-allowed}.btn-sm.svelte-1etan63{padding:var(--space-2) var(--space-3);font-size:var(--text-sm)}.btn-md.svelte-1etan63{padding:var(--space-3) var(--space-4);font-size:var(--text-base)}.btn-lg.svelte-1etan63{padding:var(--space-4) var(--space-6);font-size:var(--text-lg)}",
  map: `{"version":3,"file":"Button.svelte","sources":["Button.svelte"],"sourcesContent":["<script lang=\\"ts\\">\\n  export let variant = 'primary';\\n  export let size = 'md';\\n  export let disabled = false;\\n  export let fullWidth = false;\\n  export let href = undefined;\\n<\/script>\\n\\n{#if href}\\n  <a \\n    {href}\\n    class=\\"btn\\"\\n    class:btn-primary={variant === 'primary'}\\n    class:btn-secondary={variant === 'secondary'}\\n    class:btn-ghost={variant === 'ghost'}\\n    class:btn-success={variant === 'success'}\\n    class:btn-disabled-variant={variant === 'disabled'}\\n    class:btn-sm={size === 'sm'}\\n    class:btn-md={size === 'md'}\\n    class:btn-lg={size === 'lg'}\\n    class:btn-disabled={disabled}\\n    class:btn-full={fullWidth}\\n  >\\n    <slot />\\n  </a>\\n{:else}\\n  <button \\n    type=\\"button\\"\\n    {disabled}\\n    class=\\"btn\\"\\n    class:btn-primary={variant === 'primary'}\\n    class:btn-secondary={variant === 'secondary'}\\n    class:btn-ghost={variant === 'ghost'}\\n    class:btn-success={variant === 'success'}\\n    class:btn-disabled-variant={variant === 'disabled'}\\n    class:btn-sm={size === 'sm'}\\n    class:btn-md={size === 'md'}\\n    class:btn-lg={size === 'lg'}\\n    class:btn-disabled={disabled}\\n    class:btn-full={fullWidth}\\n    on:click\\n  >\\n    <slot />\\n  </button>\\n{/if}\\n\\n<style>\\n  .btn {\\n    display: inline-flex;\\n    align-items: center;\\n    justify-content: center;\\n    font-weight: 500;\\n    border-radius: 8px;\\n    border: none;\\n    cursor: pointer;\\n    transition: all 0.2s ease;\\n    text-decoration: none;\\n    font-family: inherit;\\n  }\\n  \\n  .btn:disabled,\\n  .btn-disabled {\\n    opacity: 0.5;\\n    cursor: not-allowed;\\n  }\\n  \\n  .btn-full {\\n    width: 100%;\\n  }\\n  \\n  /* Variants */\\n  .btn-primary {\\n    background: var(--color-primary);\\n    color: white;\\n  }\\n  \\n  .btn-primary:hover:not(:disabled) {\\n    background: var(--color-primary-hover);\\n  }\\n  \\n  .btn-secondary {\\n    background: var(--color-gray-100);\\n    color: var(--color-gray-700);\\n    border: 1px solid var(--color-gray-200);\\n  }\\n  \\n  .btn-secondary:hover:not(:disabled) {\\n    background: var(--color-gray-200);\\n  }\\n  \\n  .btn-ghost {\\n    background: transparent;\\n    color: var(--color-primary);\\n  }\\n  \\n  .btn-ghost:hover:not(:disabled) {\\n    background: var(--color-primary-pale);\\n  }\\n  \\n  .btn-success {\\n    background: #059669;\\n    color: white;\\n  }\\n  \\n  .btn-success:hover:not(:disabled) {\\n    background: #047857;\\n  }\\n  \\n  .btn-disabled-variant {\\n    background: #9ca3af;\\n    color: white;\\n    cursor: not-allowed;\\n  }\\n  \\n  /* Sizes */\\n  .btn-sm {\\n    padding: var(--space-2) var(--space-3);\\n    font-size: var(--text-sm);\\n  }\\n  \\n  .btn-md {\\n    padding: var(--space-3) var(--space-4);\\n    font-size: var(--text-base);\\n  }\\n  \\n  .btn-lg {\\n    padding: var(--space-4) var(--space-6);\\n    font-size: var(--text-lg);\\n  }\\n</style>"],"names":[],"mappings":"AA+CE,mBAAK,CACH,OAAO,CAAE,WAAW,CACpB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,GAAG,CAChB,aAAa,CAAE,GAAG,CAClB,MAAM,CAAE,IAAI,CACZ,MAAM,CAAE,OAAO,CACf,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IAAI,CACzB,eAAe,CAAE,IAAI,CACrB,WAAW,CAAE,OACf,CAEA,mBAAI,SAAS,CACb,4BAAc,CACZ,OAAO,CAAE,GAAG,CACZ,MAAM,CAAE,WACV,CAEA,wBAAU,CACR,KAAK,CAAE,IACT,CAGA,2BAAa,CACX,UAAU,CAAE,IAAI,eAAe,CAAC,CAChC,KAAK,CAAE,KACT,CAEA,2BAAY,MAAM,KAAK,SAAS,CAAE,CAChC,UAAU,CAAE,IAAI,qBAAqB,CACvC,CAEA,6BAAe,CACb,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACjC,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,gBAAgB,CACxC,CAEA,6BAAc,MAAM,KAAK,SAAS,CAAE,CAClC,UAAU,CAAE,IAAI,gBAAgB,CAClC,CAEA,yBAAW,CACT,UAAU,CAAE,WAAW,CACvB,KAAK,CAAE,IAAI,eAAe,CAC5B,CAEA,yBAAU,MAAM,KAAK,SAAS,CAAE,CAC9B,UAAU,CAAE,IAAI,oBAAoB,CACtC,CAEA,2BAAa,CACX,UAAU,CAAE,OAAO,CACnB,KAAK,CAAE,KACT,CAEA,2BAAY,MAAM,KAAK,SAAS,CAAE,CAChC,UAAU,CAAE,OACd,CAEA,oCAAsB,CACpB,UAAU,CAAE,OAAO,CACnB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,WACV,CAGA,sBAAQ,CACN,OAAO,CAAE,IAAI,SAAS,CAAC,CAAC,IAAI,SAAS,CAAC,CACtC,SAAS,CAAE,IAAI,SAAS,CAC1B,CAEA,sBAAQ,CACN,OAAO,CAAE,IAAI,SAAS,CAAC,CAAC,IAAI,SAAS,CAAC,CACtC,SAAS,CAAE,IAAI,WAAW,CAC5B,CAEA,sBAAQ,CACN,OAAO,CAAE,IAAI,SAAS,CAAC,CAAC,IAAI,SAAS,CAAC,CACtC,SAAS,CAAE,IAAI,SAAS,CAC1B"}`
};
const Button = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { variant = "primary" } = $$props;
  let { size = "md" } = $$props;
  let { disabled = false } = $$props;
  let { fullWidth = false } = $$props;
  let { href = void 0 } = $$props;
  if ($$props.variant === void 0 && $$bindings.variant && variant !== void 0) $$bindings.variant(variant);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.fullWidth === void 0 && $$bindings.fullWidth && fullWidth !== void 0) $$bindings.fullWidth(fullWidth);
  if ($$props.href === void 0 && $$bindings.href && href !== void 0) $$bindings.href(href);
  $$result.css.add(css$2);
  return `${href ? `<a${add_attribute("href", href, 0)} class="${[
    "btn svelte-1etan63",
    (variant === "primary" ? "btn-primary" : "") + " " + (variant === "secondary" ? "btn-secondary" : "") + " " + (variant === "ghost" ? "btn-ghost" : "") + " " + (variant === "success" ? "btn-success" : "") + " " + (variant === "disabled" ? "btn-disabled-variant" : "") + " " + (size === "sm" ? "btn-sm" : "") + " " + (size === "md" ? "btn-md" : "") + " " + (size === "lg" ? "btn-lg" : "") + " " + (disabled ? "btn-disabled" : "") + " " + (fullWidth ? "btn-full" : "")
  ].join(" ").trim()}">${slots.default ? slots.default({}) : ``}</a>` : `<button type="button" ${disabled ? "disabled" : ""} class="${[
    "btn svelte-1etan63",
    (variant === "primary" ? "btn-primary" : "") + " " + (variant === "secondary" ? "btn-secondary" : "") + " " + (variant === "ghost" ? "btn-ghost" : "") + " " + (variant === "success" ? "btn-success" : "") + " " + (variant === "disabled" ? "btn-disabled-variant" : "") + " " + (size === "sm" ? "btn-sm" : "") + " " + (size === "md" ? "btn-md" : "") + " " + (size === "lg" ? "btn-lg" : "") + " " + (disabled ? "btn-disabled" : "") + " " + (fullWidth ? "btn-full" : "")
  ].join(" ").trim()}">${slots.default ? slots.default({}) : ``}</button>`}`;
});
const css$1 = {
  code: ".page-layout.svelte-1c3cw99{min-height:100vh;display:flex;flex-direction:column;background:var(--color-bg-primary)}.page-header.svelte-1c3cw99{border-bottom:1px solid var(--color-gray-200);background:var(--color-bg-primary)}.page-header-content.svelte-1c3cw99{max-width:1200px;margin:0 auto;padding:var(--space-6) var(--space-4);display:flex;align-items:center;gap:var(--space-4)}.back-button.svelte-1c3cw99{background:none;border:none;color:var(--color-primary);cursor:pointer;font-size:var(--text-base)}.page-title.svelte-1c3cw99{font-size:var(--text-2xl);font-weight:700;color:var(--color-gray-900);margin:0}.page-main.svelte-1c3cw99{flex:1;margin:0 auto;padding:var(--space-8) var(--space-4);width:100%}.page-footer.svelte-1c3cw99{border-top:1px solid var(--color-gray-200);background:var(--color-bg-secondary);padding:var(--space-4);text-align:center}.footer-content.svelte-1c3cw99{color:var(--color-gray-600);font-size:var(--text-sm)}",
  map: `{"version":3,"file":"PageLayout.svelte","sources":["PageLayout.svelte"],"sourcesContent":["<script lang=\\"ts\\">\\n  export let title;\\n  export let showBackButton = false;\\n  export let maxWidth = '1200px';\\n<\/script>\\n\\n<div class=\\"page-layout\\">\\n  <header class=\\"page-header\\">\\n    <div class=\\"page-header-content\\">\\n      {#if showBackButton}\\n        <button class=\\"back-button\\" on:click={() => history.back()}>\\n          ← 戻る\\n        </button>\\n      {/if}\\n      <h1 class=\\"page-title\\">{title}</h1>\\n    </div>\\n  </header>\\n  \\n  <main class=\\"page-main\\" style=\\"max-width: {maxWidth};\\">\\n    <slot />\\n  </main>\\n  \\n  <footer class=\\"page-footer\\">\\n    <div class=\\"footer-content\\">\\n      <p>Pitch Training App v3.0.0 - Svelte移行プロトタイプ</p>\\n    </div>\\n  </footer>\\n</div>\\n\\n<style>\\n  .page-layout {\\n    min-height: 100vh;\\n    display: flex;\\n    flex-direction: column;\\n    background: var(--color-bg-primary);\\n  }\\n  \\n  .page-header {\\n    border-bottom: 1px solid var(--color-gray-200);\\n    background: var(--color-bg-primary);\\n  }\\n  \\n  .page-header-content {\\n    max-width: 1200px;\\n    margin: 0 auto;\\n    padding: var(--space-6) var(--space-4);\\n    display: flex;\\n    align-items: center;\\n    gap: var(--space-4);\\n  }\\n  \\n  .back-button {\\n    background: none;\\n    border: none;\\n    color: var(--color-primary);\\n    cursor: pointer;\\n    font-size: var(--text-base);\\n  }\\n  \\n  .page-title {\\n    font-size: var(--text-2xl);\\n    font-weight: 700;\\n    color: var(--color-gray-900);\\n    margin: 0;\\n  }\\n  \\n  .page-main {\\n    flex: 1;\\n    margin: 0 auto;\\n    padding: var(--space-8) var(--space-4);\\n    width: 100%;\\n  }\\n  \\n  .page-footer {\\n    border-top: 1px solid var(--color-gray-200);\\n    background: var(--color-bg-secondary);\\n    padding: var(--space-4);\\n    text-align: center;\\n  }\\n  \\n  .footer-content {\\n    color: var(--color-gray-600);\\n    font-size: var(--text-sm);\\n  }\\n</style>"],"names":[],"mappings":"AA8BE,2BAAa,CACX,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,UAAU,CAAE,IAAI,kBAAkB,CACpC,CAEA,2BAAa,CACX,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,gBAAgB,CAAC,CAC9C,UAAU,CAAE,IAAI,kBAAkB,CACpC,CAEA,mCAAqB,CACnB,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,OAAO,CAAE,IAAI,SAAS,CAAC,CAAC,IAAI,SAAS,CAAC,CACtC,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,GAAG,CAAE,IAAI,SAAS,CACpB,CAEA,2BAAa,CACX,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,eAAe,CAAC,CAC3B,MAAM,CAAE,OAAO,CACf,SAAS,CAAE,IAAI,WAAW,CAC5B,CAEA,0BAAY,CACV,SAAS,CAAE,IAAI,UAAU,CAAC,CAC1B,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,MAAM,CAAE,CACV,CAEA,yBAAW,CACT,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,OAAO,CAAE,IAAI,SAAS,CAAC,CAAC,IAAI,SAAS,CAAC,CACtC,KAAK,CAAE,IACT,CAEA,2BAAa,CACX,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,gBAAgB,CAAC,CAC3C,UAAU,CAAE,IAAI,oBAAoB,CAAC,CACrC,OAAO,CAAE,IAAI,SAAS,CAAC,CACvB,UAAU,CAAE,MACd,CAEA,8BAAgB,CACd,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,SAAS,CAAE,IAAI,SAAS,CAC1B"}`
};
const PageLayout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title } = $$props;
  let { showBackButton = false } = $$props;
  let { maxWidth = "1200px" } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.showBackButton === void 0 && $$bindings.showBackButton && showBackButton !== void 0) $$bindings.showBackButton(showBackButton);
  if ($$props.maxWidth === void 0 && $$bindings.maxWidth && maxWidth !== void 0) $$bindings.maxWidth(maxWidth);
  $$result.css.add(css$1);
  return `<div class="page-layout svelte-1c3cw99"><header class="page-header svelte-1c3cw99"><div class="page-header-content svelte-1c3cw99">${showBackButton ? `<button class="back-button svelte-1c3cw99" data-svelte-h="svelte-17syez7">← 戻る</button>` : ``} <h1 class="page-title svelte-1c3cw99">${escape(title)}</h1></div></header> <main class="page-main svelte-1c3cw99" style="${"max-width: " + escape(maxWidth, true) + ";"}">${slots.default ? slots.default({}) : ``}</main> <footer class="page-footer svelte-1c3cw99"><div class="footer-content svelte-1c3cw99"><p data-svelte-h="svelte-18lmrhl">Pitch Training App v3.0.0 - Svelte移行プロトタイプ</p></div></footer> </div>`;
});
const css = {
  code: ".homepage.svelte-rlkdei{max-width:800px;margin:0 auto}.hero.svelte-rlkdei{text-align:center;margin-bottom:var(--space-12)}.hero-title.svelte-rlkdei{font-size:var(--text-4xl);font-weight:700;color:var(--color-gray-900);margin-bottom:var(--space-4)}.hero-description.svelte-rlkdei{font-size:var(--text-lg);color:var(--color-gray-600);max-width:600px;margin:0 auto}.modes-grid.svelte-rlkdei{display:grid;gap:var(--space-6);grid-template-columns:1fr}@media(min-width: 768px){.modes-grid.svelte-rlkdei{grid-template-columns:repeat(auto-fit, minmax(300px, 1fr))}}.mode-card.svelte-rlkdei{text-align:center}.mode-title.svelte-rlkdei{font-size:var(--text-xl);font-weight:600;color:var(--color-gray-900);margin-bottom:var(--space-3)}.mode-description.svelte-rlkdei{font-size:var(--text-base);color:var(--color-gray-600);margin-bottom:var(--space-6);line-height:1.6}.mode-icon.svelte-rlkdei{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4) auto}.mode-icon.green.svelte-rlkdei{background-color:#d1fae5;color:#059669}.mode-icon.orange.svelte-rlkdei{background-color:#fed7aa;color:#ea580c}.mode-icon.purple.svelte-rlkdei{background-color:#e9d5ff;color:#9333ea}.mode-card.disabled.svelte-rlkdei{opacity:0.6}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">\\n  import Card from '$lib/components/Card.svelte';\\n  import Button from '$lib/components/Button.svelte';\\n  import PageLayout from '$lib/components/PageLayout.svelte';\\n<\/script>\\n\\n<PageLayout title=\\"Pitch Training App\\">\\n  <div class=\\"homepage\\">\\n    <div class=\\"hero\\">\\n      <h1 class=\\"hero-title\\">相対音感トレーニング</h1>\\n      <p class=\\"hero-description\\">\\n        ドレミファソラシドの音程関係を正確に聞き分ける力を鍛えましょう\\n      </p>\\n    </div>\\n    \\n    <div class=\\"modes-grid\\">\\n      <!-- ランダムモード（緑色テーマ） -->\\n      <Card variant=\\"default\\" padding=\\"lg\\" interactive={true}>\\n        <div class=\\"mode-card\\">\\n          <div class=\\"mode-icon green\\">\\n            <svg width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\">\\n              <path d=\\"M9 18V5l12-2v13\\"/>\\n              <circle cx=\\"6\\" cy=\\"18\\" r=\\"3\\"/>\\n              <circle cx=\\"18\\" cy=\\"16\\" r=\\"3\\"/>\\n            </svg>\\n          </div>\\n          <h3 class=\\"mode-title\\">ランダム基音モード</h3>\\n          <p class=\\"mode-description\\">\\n            10種類の基音からランダムに選択してトレーニング\\n          </p>\\n          <Button href=\\"#\\" variant=\\"success\\" size=\\"lg\\" fullWidth>\\n            トレーニング開始\\n          </Button>\\n        </div>\\n      </Card>\\n      \\n      <!-- 連続チャレンジ（オレンジ色テーマ・準備中） -->\\n      <Card variant=\\"default\\" padding=\\"lg\\" interactive={false}>\\n        <div class=\\"mode-card disabled\\">\\n          <div class=\\"mode-icon orange\\">\\n            <svg width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\">\\n              <circle cx=\\"12\\" cy=\\"12\\" r=\\"10\\"/>\\n              <polyline points=\\"12,6 12,12 16,14\\"/>\\n            </svg>\\n          </div>\\n          <h3 class=\\"mode-title\\">連続チャレンジモード</h3>\\n          <p class=\\"mode-description\\">\\n            選択した回数だけ連続で実行し、総合評価を確認\\n          </p>\\n          <Button href=\\"#\\" variant=\\"disabled\\" size=\\"lg\\" fullWidth disabled>\\n            準備中\\n          </Button>\\n        </div>\\n      </Card>\\n      \\n      <!-- 12音階モード（紫色テーマ・準備中） -->\\n      <Card variant=\\"default\\" padding=\\"lg\\" interactive={false}>\\n        <div class=\\"mode-card disabled\\">\\n          <div class=\\"mode-icon purple\\">\\n            <svg width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\">\\n              <path d=\\"M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z\\"/>\\n              <path d=\\"M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z\\"/>\\n            </svg>\\n          </div>\\n          <h3 class=\\"mode-title\\">12音階モード</h3>\\n          <p class=\\"mode-description\\">\\n            クロマチックスケールの上行・下行で完全制覇\\n          </p>\\n          <Button href=\\"#\\" variant=\\"disabled\\" size=\\"lg\\" fullWidth disabled>\\n            準備中\\n          </Button>\\n        </div>\\n      </Card>\\n    </div>\\n  </div>\\n</PageLayout>\\n\\n<style>\\n  .homepage {\\n    max-width: 800px;\\n    margin: 0 auto;\\n  }\\n  \\n  .hero {\\n    text-align: center;\\n    margin-bottom: var(--space-12);\\n  }\\n  \\n  .hero-title {\\n    font-size: var(--text-4xl);\\n    font-weight: 700;\\n    color: var(--color-gray-900);\\n    margin-bottom: var(--space-4);\\n  }\\n  \\n  .hero-description {\\n    font-size: var(--text-lg);\\n    color: var(--color-gray-600);\\n    max-width: 600px;\\n    margin: 0 auto;\\n  }\\n  \\n  .modes-grid {\\n    display: grid;\\n    gap: var(--space-6);\\n    grid-template-columns: 1fr;\\n  }\\n  \\n  @media (min-width: 768px) {\\n    .modes-grid {\\n      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\\n    }\\n  }\\n  \\n  .mode-card {\\n    text-align: center;\\n  }\\n  \\n  .mode-title {\\n    font-size: var(--text-xl);\\n    font-weight: 600;\\n    color: var(--color-gray-900);\\n    margin-bottom: var(--space-3);\\n  }\\n  \\n  .mode-description {\\n    font-size: var(--text-base);\\n    color: var(--color-gray-600);\\n    margin-bottom: var(--space-6);\\n    line-height: 1.6;\\n  }\\n  \\n  .mode-icon {\\n    width: 48px;\\n    height: 48px;\\n    border-radius: 50%;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    margin: 0 auto var(--space-4) auto;\\n  }\\n  \\n  .mode-icon.green {\\n    background-color: #d1fae5;\\n    color: #059669;\\n  }\\n  \\n  .mode-icon.orange {\\n    background-color: #fed7aa;\\n    color: #ea580c;\\n  }\\n  \\n  .mode-icon.purple {\\n    background-color: #e9d5ff;\\n    color: #9333ea;\\n  }\\n  \\n  .mode-card.disabled {\\n    opacity: 0.6;\\n  }\\n</style>"],"names":[],"mappings":"AA8EE,uBAAU,CACR,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,CAAC,CAAC,IACZ,CAEA,mBAAM,CACJ,UAAU,CAAE,MAAM,CAClB,aAAa,CAAE,IAAI,UAAU,CAC/B,CAEA,yBAAY,CACV,SAAS,CAAE,IAAI,UAAU,CAAC,CAC1B,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,aAAa,CAAE,IAAI,SAAS,CAC9B,CAEA,+BAAkB,CAChB,SAAS,CAAE,IAAI,SAAS,CAAC,CACzB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,CAAC,CAAC,IACZ,CAEA,yBAAY,CACV,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IAAI,SAAS,CAAC,CACnB,qBAAqB,CAAE,GACzB,CAEA,MAAO,YAAY,KAAK,CAAE,CACxB,yBAAY,CACV,qBAAqB,CAAE,OAAO,QAAQ,CAAC,CAAC,OAAO,KAAK,CAAC,CAAC,GAAG,CAAC,CAC5D,CACF,CAEA,wBAAW,CACT,UAAU,CAAE,MACd,CAEA,yBAAY,CACV,SAAS,CAAE,IAAI,SAAS,CAAC,CACzB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,aAAa,CAAE,IAAI,SAAS,CAC9B,CAEA,+BAAkB,CAChB,SAAS,CAAE,IAAI,WAAW,CAAC,CAC3B,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,aAAa,CAAE,IAAI,SAAS,CAAC,CAC7B,WAAW,CAAE,GACf,CAEA,wBAAW,CACT,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,MAAM,CAAE,CAAC,CAAC,IAAI,CAAC,IAAI,SAAS,CAAC,CAAC,IAChC,CAEA,UAAU,oBAAO,CACf,gBAAgB,CAAE,OAAO,CACzB,KAAK,CAAE,OACT,CAEA,UAAU,qBAAQ,CAChB,gBAAgB,CAAE,OAAO,CACzB,KAAK,CAAE,OACT,CAEA,UAAU,qBAAQ,CAChB,gBAAgB,CAAE,OAAO,CACzB,KAAK,CAAE,OACT,CAEA,UAAU,uBAAU,CAClB,OAAO,CAAE,GACX"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${validate_component(PageLayout, "PageLayout").$$render($$result, { title: "Pitch Training App" }, {}, {
    default: () => {
      return `<div class="homepage svelte-rlkdei"><div class="hero svelte-rlkdei"><h1 class="hero-title svelte-rlkdei" data-svelte-h="svelte-1h4goym">相対音感トレーニング</h1> <p class="hero-description svelte-rlkdei" data-svelte-h="svelte-ukit5l">ドレミファソラシドの音程関係を正確に聞き分ける力を鍛えましょう</p></div> <div class="modes-grid svelte-rlkdei"> ${validate_component(Card, "Card").$$render(
        $$result,
        {
          variant: "default",
          padding: "lg",
          interactive: true
        },
        {},
        {
          default: () => {
            return `<div class="mode-card svelte-rlkdei"><div class="mode-icon green svelte-rlkdei"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></div> <h3 class="mode-title svelte-rlkdei" data-svelte-h="svelte-zr5chz">ランダム基音モード</h3> <p class="mode-description svelte-rlkdei" data-svelte-h="svelte-pquvhb">10種類の基音からランダムに選択してトレーニング</p> ${validate_component(Button, "Button").$$render(
              $$result,
              {
                href: "#",
                variant: "success",
                size: "lg",
                fullWidth: true
              },
              {},
              {
                default: () => {
                  return `トレーニング開始`;
                }
              }
            )}</div>`;
          }
        }
      )}  ${validate_component(Card, "Card").$$render(
        $$result,
        {
          variant: "default",
          padding: "lg",
          interactive: false
        },
        {},
        {
          default: () => {
            return `<div class="mode-card disabled svelte-rlkdei"><div class="mode-icon orange svelte-rlkdei"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg></div> <h3 class="mode-title svelte-rlkdei" data-svelte-h="svelte-3z8jx2">連続チャレンジモード</h3> <p class="mode-description svelte-rlkdei" data-svelte-h="svelte-6e8jen">選択した回数だけ連続で実行し、総合評価を確認</p> ${validate_component(Button, "Button").$$render(
              $$result,
              {
                href: "#",
                variant: "disabled",
                size: "lg",
                fullWidth: true,
                disabled: true
              },
              {},
              {
                default: () => {
                  return `準備中`;
                }
              }
            )}</div>`;
          }
        }
      )}  ${validate_component(Card, "Card").$$render(
        $$result,
        {
          variant: "default",
          padding: "lg",
          interactive: false
        },
        {},
        {
          default: () => {
            return `<div class="mode-card disabled svelte-rlkdei"><div class="mode-icon purple svelte-rlkdei"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg></div> <h3 class="mode-title svelte-rlkdei" data-svelte-h="svelte-phqvlc">12音階モード</h3> <p class="mode-description svelte-rlkdei" data-svelte-h="svelte-1gjudyt">クロマチックスケールの上行・下行で完全制覇</p> ${validate_component(Button, "Button").$$render(
              $$result,
              {
                href: "#",
                variant: "disabled",
                size: "lg",
                fullWidth: true,
                disabled: true
              },
              {},
              {
                default: () => {
                  return `準備中`;
                }
              }
            )}</div>`;
          }
        }
      )}</div></div>`;
    }
  })}`;
});
export {
  Page as default
};
