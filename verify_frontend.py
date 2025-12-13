from playwright.sync_api import sync_playwright
import time
import os

def verify():
    # Ensure dir exists
    os.makedirs("/home/jules/verification", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Waiting for server to be ready...")
        time.sleep(15)

        # 1. Visit Community
        print("Visiting /community...")
        try:
            page.goto("http://localhost:3000/community", timeout=60000)
        except Exception as e:
            print(f"Failed to load page: {e}")
            return

        time.sleep(5) # Wait for hydration/content

        print(f"Page title: {page.title()}")

        # Take screenshot
        page.screenshot(path="/home/jules/verification/community.png")
        print("Screenshot saved to /home/jules/verification/community.png")

        # 2. Try to find VehicleCard (it has class 'bg-card' and 'rounded-2xl')
        # My DashboardCard and VehicleCard both use these.
        cards = page.locator(".bg-card.rounded-2xl")
        count = cards.count()
        print(f"Found {count} cards")

        if count > 0:
            # Hover the first one
            first_card = cards.first
            try:
                first_card.hover(timeout=2000)
                time.sleep(1)
                page.screenshot(path="/home/jules/verification/community_hover.png")
                print("Hover screenshot saved")
            except Exception as e:
                print(f"Hover failed: {e}")
        else:
            print("No cards found. Screenshotting body to see what happened.")
            page.screenshot(path="/home/jules/verification/body.png")

        browser.close()

if __name__ == "__main__":
    verify()
