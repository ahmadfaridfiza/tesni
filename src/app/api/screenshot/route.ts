import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let browser = null;
  
  try {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setDefaultNavigationTimeout(20000);

    await page.goto(targetUrl, { 
      waitUntil: 'networkidle2'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    // Solusi paling sederhana - cast ke any sementara
    return new NextResponse(screenshot as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
      },
    });

  } catch (error: any) {
    console.error('Screenshot error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to capture screenshot' },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export const config = {
  runtime: 'nodejs',
};