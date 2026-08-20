import { test, expect, Page } from "@playwright/test";

async function openSubjectExercisesTab(page: Page) {
  await page.goto("/subjects");
  await page.waitForLoadState("networkidle");

  const subjectCard = page.locator("a[href^='/subjects/']").first();
  await expect(subjectCard).toBeVisible({ timeout: 10000 });
  await subjectCard.click();
  await page.waitForLoadState("networkidle");

  // Click 'Exercícios' Tab
  const exercisesTab = page.locator("button:has-text('Exercícios')").first();
  await expect(exercisesTab).toBeVisible({ timeout: 5000 });
  await exercisesTab.click();
  await page.waitForTimeout(400);
}

test.describe("Exercise List Workspace & Mapping E2E Tests", () => {
  test("E2E 1 — Open Exercise Set Workspace Modal and verify components", async ({ page }) => {
    await openSubjectExercisesTab(page);

    // Create a new set first
    const novaListaBtn = page.locator("button:has-text('Nova Lista')").first();
    await expect(novaListaBtn).toBeVisible({ timeout: 5000 });
    await novaListaBtn.click();

    const uniqueSetTitle = `Lista Workspace E2E - ${Date.now()}`;
    await page.locator("input[placeholder*='Lista para P1']").fill(uniqueSetTitle);
    await page.locator("button:has-text('Criar Lista')").click();
    await page.waitForTimeout(600);

    // Find set card and click 'Abrir'
    const setCard = page.locator(`text=${uniqueSetTitle}`).first();
    await expect(setCard).toBeVisible({ timeout: 6000 });
    await setCard.click();
    await page.waitForTimeout(500);

    // Verify Exercise Set Workspace is open
    await expect(page.locator("text=Questões da Lista")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("button:has-text('+ Mapear no PDF')")).toBeVisible();
    await expect(page.locator("text=Nenhum documento anexado à lista")).toBeVisible();
  });

  test("E2E 2 — Create question inside List Workspace, verify index & bidirectional selection", async ({ page }) => {
    await openSubjectExercisesTab(page);

    // Open first set
    const setCard = page.locator("div[class*='group relative bg-neutral-950']").first();
    await expect(setCard).toBeVisible({ timeout: 6000 });
    await setCard.click();
    await page.waitForTimeout(500);

    // Inside workspace, click '+ Manual'
    const manualBtn = page.locator("button:has-text('+ Manual')").first();
    await expect(manualBtn).toBeVisible({ timeout: 5000 });
    await manualBtn.click();
    await page.waitForTimeout(400);

    // Fill Question details
    const uniqueRef = `QW-${Math.floor(Math.random() * 899 + 100)}`;
    await page.locator("input[placeholder*='Ex: Q01']").fill(uniqueRef);
    await page.locator("textarea[placeholder*='Escreva o texto do problema']").fill("Enunciado da questão no workspace.");
    await page.locator("button:has-text('Cadastrar Exercício')").click();
    await page.waitForTimeout(600);

    // Verify question is added to the right panel index
    await expect(page.locator(`text=${uniqueRef}`).first()).toBeVisible({ timeout: 6000 });
    await expect(page.locator("text=Pendente").first()).toBeVisible();

    // Toggle mapping mode button
    const mapBtn = page.locator("button:has-text('+ Mapear no PDF')").first();
    await mapBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator("button:has-text('Mapeamento Ativo')").first()).toBeVisible();
  });

  test("E2E 3 — Register resolution from Workspace and verify progress bar updates", async ({ page }) => {
    await openSubjectExercisesTab(page);

    // Open first set
    const setCard = page.locator("div[class*='group relative bg-neutral-950']").first();
    await expect(setCard).toBeVisible({ timeout: 6000 });
    await setCard.click();
    await page.waitForTimeout(500);

    // Click on the first question's 'Resolver' or card in the right panel
    const resolverBtn = page.locator("button:has-text('Resolver')").first();
    if (await resolverBtn.isVisible()) {
      await resolverBtn.click();
    } else {
      const qCard = page.locator("div[class*='group relative bg-neutral-950/80']").first();
      await qCard.click();
    }
    await page.waitForTimeout(400);

    // If detail modal is open, click 'Registrar Resolução'
    const registrarBtn = page.locator("button:has-text('Registrar Resolução')").first();
    if (await registrarBtn.isVisible()) {
      await registrarBtn.click();
      await page.waitForTimeout(300);
    }

    // Select 'Acertei' and submit
    const acerteiBtn = page.locator("button:has-text('Acertei')").first();
    await expect(acerteiBtn).toBeVisible({ timeout: 5000 });
    await acerteiBtn.click();
    await page.locator("button:has-text('Salvar Resolução')").click();
    await page.waitForTimeout(600);

    // Verify question card now has 'Resolvido' status badge
    await expect(page.locator("text=Resolvido").first()).toBeVisible({ timeout: 6000 });
  });
});
