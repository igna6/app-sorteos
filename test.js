const puppeteer = require('puppeteer');
const { exec } = require('child_process');

async function run() {
  const server = exec('npm run dev', { cwd: 'c:\\Users\\ignac\\Desktop\\app-sorteos\\client' });
  
  await new Promise(r => setTimeout(r, 3000)); // wait for vite to start

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000)); // wait for react to render

  await browser.close();
  server.kill();
}

run();
