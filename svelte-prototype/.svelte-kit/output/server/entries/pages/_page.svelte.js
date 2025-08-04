import { c as create_ssr_component, v as validate_component } from "../../chunks/ssr.js";
import { C as Card } from "../../chunks/Card.js";
import { B as Button } from "../../chunks/Button.js";
import { P as PageLayout } from "../../chunks/PageLayout.js";
const css = {
  code: ".homepage.svelte-ultaxw{max-width:800px;margin:0 auto}.hero.svelte-ultaxw{text-align:center;margin-bottom:var(--space-12)}.hero-title.svelte-ultaxw{font-size:var(--text-4xl);font-weight:700;color:var(--color-gray-900);margin-bottom:var(--space-4)}.hero-description.svelte-ultaxw{font-size:var(--text-lg);color:var(--color-gray-600);max-width:600px;margin:0 auto}.modes-grid.svelte-ultaxw{display:grid;gap:var(--space-6);grid-template-columns:1fr}@media(min-width: 768px){.modes-grid.svelte-ultaxw{grid-template-columns:repeat(auto-fit, minmax(300px, 1fr))}}.mode-card.svelte-ultaxw{text-align:center}.mode-title.svelte-ultaxw{font-size:var(--text-xl);font-weight:600;color:var(--color-gray-900);margin-bottom:var(--space-3)}.mode-description.svelte-ultaxw{font-size:var(--text-base);color:var(--color-gray-600);margin-bottom:var(--space-6);line-height:1.6}.mode-icon.svelte-ultaxw{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4) auto}.mode-icon.green.svelte-ultaxw{background-color:#d1fae5;color:#059669}.mode-icon.orange.svelte-ultaxw{background-color:#fed7aa;color:#ea580c}.mode-icon.purple.svelte-ultaxw{background-color:#e9d5ff;color:#9333ea}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script>\\n  import Card from '$lib/components/Card.svelte';\\n  import Button from '$lib/components/Button.svelte';\\n  import PageLayout from '$lib/components/PageLayout.svelte';\\n<\/script>\\n\\n<PageLayout>\\n  <div class=\\"homepage\\">\\n    <div class=\\"hero\\">\\n      <h1 class=\\"hero-title\\">音程の相対的な関係を効果的に鍛える</h1>\\n      <p class=\\"hero-description\\">\\n        高精度音程検出とピアノ音源による本格的な相対音感トレーニング\\n      </p>\\n    </div>\\n    \\n    <div class=\\"modes-grid\\">\\n      <!-- ランダムモード（緑色テーマ） -->\\n      <Card variant=\\"default\\" padding=\\"lg\\" interactive={true}>\\n        <div class=\\"mode-card\\">\\n          <div class=\\"mode-icon green\\">\\n            <svg width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\">\\n              <path d=\\"M9 18V5l12-2v13\\"/>\\n              <circle cx=\\"6\\" cy=\\"18\\" r=\\"3\\"/>\\n              <circle cx=\\"18\\" cy=\\"16\\" r=\\"3\\"/>\\n            </svg>\\n          </div>\\n          <h3 class=\\"mode-title\\">ランダム基音モード</h3>\\n          <p class=\\"mode-description\\">\\n            10種類の基音からランダムに選択してトレーニング\\n          </p>\\n          <Button href=\\"./microphone-test?mode=random\\" variant=\\"success\\" size=\\"lg\\" fullWidth>\\n            トレーニング開始\\n          </Button>\\n        </div>\\n      </Card>\\n      \\n      <!-- 連続チャレンジモード（オレンジ色テーマ） -->\\n      <Card variant=\\"default\\" padding=\\"lg\\" interactive={true}>\\n        <div class=\\"mode-card\\">\\n          <div class=\\"mode-icon orange\\">\\n            <svg width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\">\\n              <circle cx=\\"12\\" cy=\\"12\\" r=\\"10\\"/>\\n              <circle cx=\\"12\\" cy=\\"12\\" r=\\"6\\"/>\\n              <circle cx=\\"12\\" cy=\\"12\\" r=\\"2\\"/>\\n            </svg>\\n          </div>\\n          <h3 class=\\"mode-title\\">連続チャレンジモード</h3>\\n          <p class=\\"mode-description\\">\\n            選択した回数だけ連続で実行し、総合評価を確認\\n          </p>\\n          <Button href=\\"./microphone-test?mode=continuous\\" variant=\\"warning\\" size=\\"lg\\" fullWidth>\\n            トレーニング開始\\n          </Button>\\n        </div>\\n      </Card>\\n      \\n      <!-- 12音階モード（紫色テーマ） -->\\n      <Card variant=\\"default\\" padding=\\"lg\\" interactive={true}>\\n        <div class=\\"mode-card\\">\\n          <div class=\\"mode-icon purple\\">\\n            <svg width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\">\\n              <path d=\\"M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z\\"/>\\n              <path d=\\"M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z\\"/>\\n            </svg>\\n          </div>\\n          <h3 class=\\"mode-title\\">12音階モード</h3>\\n          <p class=\\"mode-description\\">\\n            クロマチックスケールの上行・下行で完全制覇\\n          </p>\\n          <Button href=\\"./microphone-test?mode=chromatic\\" variant=\\"tertiary\\" size=\\"lg\\" fullWidth>\\n            トレーニング開始\\n          </Button>\\n        </div>\\n      </Card>\\n    </div>\\n  </div>\\n</PageLayout>\\n\\n<style>\\n  .homepage {\\n    max-width: 800px;\\n    margin: 0 auto;\\n  }\\n  \\n  .hero {\\n    text-align: center;\\n    margin-bottom: var(--space-12);\\n  }\\n  \\n  .hero-title {\\n    font-size: var(--text-4xl);\\n    font-weight: 700;\\n    color: var(--color-gray-900);\\n    margin-bottom: var(--space-4);\\n  }\\n  \\n  .hero-description {\\n    font-size: var(--text-lg);\\n    color: var(--color-gray-600);\\n    max-width: 600px;\\n    margin: 0 auto;\\n  }\\n  \\n  .modes-grid {\\n    display: grid;\\n    gap: var(--space-6);\\n    grid-template-columns: 1fr;\\n  }\\n  \\n  @media (min-width: 768px) {\\n    .modes-grid {\\n      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\\n    }\\n  }\\n  \\n  .mode-card {\\n    text-align: center;\\n  }\\n  \\n  .mode-title {\\n    font-size: var(--text-xl);\\n    font-weight: 600;\\n    color: var(--color-gray-900);\\n    margin-bottom: var(--space-3);\\n  }\\n  \\n  .mode-description {\\n    font-size: var(--text-base);\\n    color: var(--color-gray-600);\\n    margin-bottom: var(--space-6);\\n    line-height: 1.6;\\n  }\\n  \\n  .mode-icon {\\n    width: 48px;\\n    height: 48px;\\n    border-radius: 50%;\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    margin: 0 auto var(--space-4) auto;\\n  }\\n  \\n  .mode-icon.green {\\n    background-color: #d1fae5;\\n    color: #059669;\\n  }\\n  \\n  .mode-icon.orange {\\n    background-color: #fed7aa;\\n    color: #ea580c;\\n  }\\n  \\n  .mode-icon.purple {\\n    background-color: #e9d5ff;\\n    color: #9333ea;\\n  }\\n  \\n</style>"],"names":[],"mappings":"AA+EE,uBAAU,CACR,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,CAAC,CAAC,IACZ,CAEA,mBAAM,CACJ,UAAU,CAAE,MAAM,CAClB,aAAa,CAAE,IAAI,UAAU,CAC/B,CAEA,yBAAY,CACV,SAAS,CAAE,IAAI,UAAU,CAAC,CAC1B,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,aAAa,CAAE,IAAI,SAAS,CAC9B,CAEA,+BAAkB,CAChB,SAAS,CAAE,IAAI,SAAS,CAAC,CACzB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,CAAC,CAAC,IACZ,CAEA,yBAAY,CACV,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IAAI,SAAS,CAAC,CACnB,qBAAqB,CAAE,GACzB,CAEA,MAAO,YAAY,KAAK,CAAE,CACxB,yBAAY,CACV,qBAAqB,CAAE,OAAO,QAAQ,CAAC,CAAC,OAAO,KAAK,CAAC,CAAC,GAAG,CAAC,CAC5D,CACF,CAEA,wBAAW,CACT,UAAU,CAAE,MACd,CAEA,yBAAY,CACV,SAAS,CAAE,IAAI,SAAS,CAAC,CACzB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,aAAa,CAAE,IAAI,SAAS,CAC9B,CAEA,+BAAkB,CAChB,SAAS,CAAE,IAAI,WAAW,CAAC,CAC3B,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,aAAa,CAAE,IAAI,SAAS,CAAC,CAC7B,WAAW,CAAE,GACf,CAEA,wBAAW,CACT,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,MAAM,CAAE,CAAC,CAAC,IAAI,CAAC,IAAI,SAAS,CAAC,CAAC,IAChC,CAEA,UAAU,oBAAO,CACf,gBAAgB,CAAE,OAAO,CACzB,KAAK,CAAE,OACT,CAEA,UAAU,qBAAQ,CAChB,gBAAgB,CAAE,OAAO,CACzB,KAAK,CAAE,OACT,CAEA,UAAU,qBAAQ,CAChB,gBAAgB,CAAE,OAAO,CACzB,KAAK,CAAE,OACT"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${validate_component(PageLayout, "PageLayout").$$render($$result, {}, {}, {
    default: () => {
      return `<div class="homepage svelte-ultaxw"><div class="hero svelte-ultaxw"><h1 class="hero-title svelte-ultaxw" data-svelte-h="svelte-1nz24lg">音程の相対的な関係を効果的に鍛える</h1> <p class="hero-description svelte-ultaxw" data-svelte-h="svelte-1p99t5t">高精度音程検出とピアノ音源による本格的な相対音感トレーニング</p></div> <div class="modes-grid svelte-ultaxw"> ${validate_component(Card, "Card").$$render(
        $$result,
        {
          variant: "default",
          padding: "lg",
          interactive: true
        },
        {},
        {
          default: () => {
            return `<div class="mode-card svelte-ultaxw"><div class="mode-icon green svelte-ultaxw"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></div> <h3 class="mode-title svelte-ultaxw" data-svelte-h="svelte-zr5chz">ランダム基音モード</h3> <p class="mode-description svelte-ultaxw" data-svelte-h="svelte-pquvhb">10種類の基音からランダムに選択してトレーニング</p> ${validate_component(Button, "Button").$$render(
              $$result,
              {
                href: "./microphone-test?mode=random",
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
          interactive: true
        },
        {},
        {
          default: () => {
            return `<div class="mode-card svelte-ultaxw"><div class="mode-icon orange svelte-ultaxw"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></div> <h3 class="mode-title svelte-ultaxw" data-svelte-h="svelte-3z8jx2">連続チャレンジモード</h3> <p class="mode-description svelte-ultaxw" data-svelte-h="svelte-6e8jen">選択した回数だけ連続で実行し、総合評価を確認</p> ${validate_component(Button, "Button").$$render(
              $$result,
              {
                href: "./microphone-test?mode=continuous",
                variant: "warning",
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
          interactive: true
        },
        {},
        {
          default: () => {
            return `<div class="mode-card svelte-ultaxw"><div class="mode-icon purple svelte-ultaxw"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg></div> <h3 class="mode-title svelte-ultaxw" data-svelte-h="svelte-phqvlc">12音階モード</h3> <p class="mode-description svelte-ultaxw" data-svelte-h="svelte-1gjudyt">クロマチックスケールの上行・下行で完全制覇</p> ${validate_component(Button, "Button").$$render(
              $$result,
              {
                href: "./microphone-test?mode=chromatic",
                variant: "tertiary",
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
      )}</div></div>`;
    }
  })}`;
});
export {
  Page as default
};
