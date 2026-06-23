import type { JSX } from "react";
import { Suspense, lazy } from "react";
import { MDXProvider } from "@immediately-run/sdk";
import Callout from "./components/Callout";
import Button from "./components/Button";
import More from "./components/More";
import Image from "./components/Image";

declare const module: any;

const mdxComponents = {
  Callout,
  Button,
  More,
  img: Image,
};

// Lazy-loaded main homepage / wiki router
const Homepage = lazy(() => module.dynamicImport("./pages/landing.tsx", "*"));

export const App = (): JSX.Element => {
  return (
    <MDXProvider components={mdxComponents}>
      <div className="container">
        <header>
          <div className="header-content">
            <div className="logo">immediately.blog.</div>
            <nav>
              <ul>
                <li><a href="#">home</a></li>
                <li><a href="#">categories</a></li>
                <li><a href="#">about</a></li>
              </ul>
            </nav>
          </div>
        </header>

        <Suspense fallback={<div className="loading-state">Loading workspace...</div>}>
          <Homepage />
        </Suspense>

        <footer>
          <div className="footer-content">
            built natively as an immediately.run application. zero servers. zero build steps.
          </div>
        </footer>
      </div>
    </MDXProvider>
  );
};

export default App;
