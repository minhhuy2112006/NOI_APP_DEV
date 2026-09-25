import {defineConfig} from '@playwright/test';
import {resolve} from 'node:path';
export default defineConfig({
 testDir:'./e2e',workers:1,timeout:90000,expect:{timeout:15000},
 use:{baseURL:'http://localhost:3100',channel:'msedge',headless:true,viewport:{width:1440,height:1000},screenshot:'only-on-failure',trace:'retain-on-failure'},
 webServer:{command:'npm run dev -- --port 3100',url:'http://localhost:3100',timeout:120000,reuseExistingServer:false,env:{NOI_MODE:'demo',NOI_TEST_DB:resolve('.data/playwright.sqlite'),NOI_BUILD_DIR:'.next-e2e',NEXT_PUBLIC_SITE_URL:'http://localhost:3100'}},
});
