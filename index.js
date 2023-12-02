import express from 'express';
const app = express();
import { Cluster } from 'puppeteer-cluster';
import vanillaPuppeteer from 'puppeteer'

import { addExtra } from 'puppeteer-extra'
import {Solver} from '2captcha-ts'
import Stealth from 'puppeteer-extra-plugin-stealth'
import BlockResources from 'puppeteer-extra-plugin-block-resources'
import { readFileSync } from 'fs'



(async () => {
    const solver = new Solver("bbcda2736171d751b9ab1287fa17e77f")
    
    const puppeteer = addExtra(vanillaPuppeteer)
    puppeteer.use(Stealth())
    puppeteer.use(BlockResources({
        blockedTypes: new Set(['image', 'video', 'font', 'manifest'])
    }))
    const cluster = await Cluster.launch({
        puppeteer,
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 25, 
        monitor: true,
        puppeteerOptions: {
            targetFilter: (target) => !!target.url(),
            executablePath: '/usr/bin/chromium-browser',
            ignoreHTTPSErrors: true,
            headless: false,
            args: [
                '--autoplay-policy=user-gesture-required',
               
                '--disable-background-timer-throttling',
                '--disable-breakpad',
                '--disable-client-side-phishing-detection',
                '--disable-component-update',
                '--disable-default-apps',
                '--disable-dev-shm-usage',
                '--disable-domain-reliability',
                '--disable-extensions',
                '--disable-features=AudioServiceOutOfProcess',
                '--disable-hang-monitor',
                '--disable-ipc-flooding-protection',
                '--disable-notifications',
                '--disable-offer-store-unmasked-wallet-cards',
                '--disable-popup-blocking',
                '--disable-print-preview',
                '--disable-prompt-on-repost',
                '--disable-setuid-sandbox',
                '--disable-speech-api',
                '--disable-sync',
                '--disable-lazy-frame-loading',
                '--hide-scrollbars',
                '--ignore-gpu-blacklist',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-default-browser-check',
                '--no-first-run',
                '--no-pings',
                '--no-sandbox',
                '--no-zygote',
                '--password-store=basic',
                '--use-gl=swiftshader',
                '--use-mock-keychain',
                '--ignore-certificate-errors',
                '--enable-automation',

                
                '--enable-automation',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-ipc-flooding-protection',
                '--disable-quic'
            ],
        },
        timeout: 180000
    });

    // setup the function to be executed for each request
    await cluster.task(async ({ page, data: url }) => {
        const preloadFile = readFileSync('./inject.js', 'utf8')
        await page.evaluateOnNewDocument(preloadFile)

        let updated = false
        page.on('console', async (msg) => {
            const txt = msg.text()
            if (txt.includes('intercepted-params:')) {
                const params = JSON.parse(txt.replace('intercepted-params:', ''))
        
                try {
                    const res = await solver[params.captcha](params)

                    updated = true

                    await page.evaluate((token) => {
                        cfCallback(token)
                    }, res.data)

                } catch (e) {
                    return
                }
            } else {
                return;
            }
        })        

        try {
            await page.goto(url, {waitUntil: 'domcontentloaded'});
        } catch (error) {
            await page.goto(url.replace("http:", "https:"), {waitUntil: 'domcontentloaded'});
        }

        

       

        const parsedUrl = await page.url()
        await new Promise((r) => setTimeout(r, 500))
        try {
            let isTurnstile = await page.$eval('#turnstile-wrapper', (el) => !!el);
            if (isTurnstile) { 
                try {
                    while (await page.$eval('#turnstile-wrapper', (el) => !!el)) {
                        await new Promise((r) => setTimeout(r, 1000))
                    }
                } catch (error) {
                    await new Promise((r) => setTimeout(r, 3000))
                }
            
            }
        } catch (error) {
            
        }
        let description = '';
        const title = await page.title();
        let html = await page.content();
        const extractedText = await page.$eval('*', (el) => el.innerText);
        if (extractedText.length < 20) {
            await new Promise((r) => setTimeout(r, 1500))
            html = await page.content();
        }
        try {
            description = await page.$eval('meta[name="description"]', el => el.content);
        } catch (error) {
            //
        }

        page.close()

        return {
            url: parsedUrl,
            html,
            title,
            description,
        };
    });

    // setup server
    app.get('/', async function (req, res) { // expects URL to be given by ?url=...
        if (!req.query.url) {
            return res.end('Please specify url like this: ?url=example.com');
        }
        try {
            const data = await cluster.execute(req.query.url);

            res.json(data);
        } catch (err) {
            // catch error
            console.log(err.message)
            res.status(500).json({err: err.message});
        }
    });

    app.listen(3000, function () {
        console.log('Server listening on port 3000.');
    });
})();
