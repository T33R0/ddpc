from playwright.sync_api import sync_playwright
import time

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/community")
        time.sleep(2)

        # Inject card HTML matching VehicleCard
        html = """
        <div id="mock-card-container" style="position: absolute; top: 200px; left: 50px; width: 400px; z-index: 9999;">
            <div class="group transition-all duration-300">
                <div class="bg-card rounded-2xl p-4 text-foreground flex flex-col gap-4 border border-border transition-all duration-300 ease-out group-hover:scale-105 group-hover:border-accent group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.6)]">
                    <div class="relative w-full aspect-video overflow-hidden rounded-lg bg-white/10 flex items-center justify-center">
                         <span class="text-white">Image</span>
                    </div>
                    <div class="flex flex-col gap-1 items-start">
                        <h3 class="font-bold text-lg text-foreground line-clamp-1">Mock Vehicle</h3>
                        <div class="text-sm text-muted-foreground line-clamp-1">2024 Mock Model</div>
                    </div>
                    <div class="flex justify-between items-center mt-auto pt-2">
                        <div class="text-xs text-muted-foreground">10,000 mi</div>
                        <div class="text-xs text-muted-foreground font-semibold">Active</div>
                    </div>
                </div>
            </div>
        </div>
        """

        page.evaluate(f"document.body.insertAdjacentHTML('beforeend', `{html}`)")

        # Screenshot normal
        page.screenshot(path="/home/jules/verification/mock_card_normal.png")

        # Hover
        card = page.locator("#mock-card-container .group").first
        card.hover()
        time.sleep(1)
        page.screenshot(path="/home/jules/verification/mock_card_hover.png")

        browser.close()

if __name__ == "__main__":
    verify()
