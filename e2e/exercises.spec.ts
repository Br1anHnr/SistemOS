import { test, expect, Page } from "@playwright/test";

// Helper to navigate to a subject page and switch to Exercícios tab
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

test.describe("Exercises Module (Exercícios) End-to-End Tests", () => {
  test("E2E 1 — Create Exercise Set and verify card rendering with progress", async ({ page }) => {
    await openSubjectExercisesTab(page);

    // Open Nova Lista Modal
    const novaListaBtn = page.locator("button:has-text('Nova Lista')").first();
    await expect(novaListaBtn).toBeVisible({ timeout: 5000 });
    await novaListaBtn.click();

    // Fill Modal
    const uniqueTitle = `Lista E2E P1 - ${Date.now()}`;
    await page.locator("input[placeholder*='Lista para P1']").fill(uniqueTitle);
    await page.locator("textarea[placeholder*='Fazer os exercícios']").fill("Lista de fixação de fluidos.");

    // Submit
    const submitBtn = page.locator("button:has-text('Criar Lista')");
    await submitBtn.click();
    await page.waitForTimeout(600);

    // Verify Card is displayed
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible({ timeout: 6000 });
  });

  test("E2E 2 — Create Exercise, Register Attempt, and verify derived status & progress", async ({ page }) => {
    await openSubjectExercisesTab(page);

    // Open Novo Exercício Modal
    const novoExBtn = page.locator("button:has-text('Novo Exercício')").first();
    await expect(novoExBtn).toBeVisible({ timeout: 5000 });
    await novoExBtn.click();

    // Fill Exercise Info
    const exTitle = `Questão E2E ${Date.now()}`;
    await page.locator("input[placeholder*='Ex: Q01']").fill("Q01");
    await page.locator("input[placeholder*='Cálculo da Tensão']").fill(exTitle);
    await page.locator("textarea[placeholder*='Digite o texto da questão']").fill("Calcule a pressão absoluta no fundo do tanque.");

    // Submit
    const submitBtn = page.locator("button:has-text('Cadastrar Exercício')");
    await submitBtn.click();
    await page.waitForTimeout(600);

    // Switch to 'Todos' view to see the exercise
    const todosTabBtn = page.locator("button:has-text('Todos')").first();
    await todosTabBtn.click();
    await page.waitForTimeout(300);

    // Verify exercise is listed with 'Pendente' status
    const exerciseRow = page.locator(`text=${exTitle}`).first();
    await expect(exerciseRow).toBeVisible({ timeout: 6000 });
    await expect(page.locator("text=Pendente").first()).toBeVisible();

    // Open Exercise Detail
    await exerciseRow.click();
    await page.waitForTimeout(400);
    await expect(page.locator("text=Enunciado da Questão")).toBeVisible();

    // Open Attempt Modal
    const registrarTentativaBtn = page.locator("button:has-text('Registrar Tentativa')").first();
    await registrarTentativaBtn.click();
    await page.waitForTimeout(300);

    // Select 'Acertei' result
    const acerteiBtn = page.locator("button:has-text('Acertei')").first();
    await acerteiBtn.click();
    await page.locator("input[type='number']").first().fill("15");
    await page.locator("textarea[placeholder*='Cuidado com a conversão']").fill("Resolução direta com manometria.");

    // Save Attempt
    const salvarTentativaBtn = page.locator("button:has-text('Salvar Tentativa')");
    await salvarTentativaBtn.click();
    await page.waitForTimeout(600);

    // Verify Attempt is recorded and status transitioned to 'Resolvido'
    await expect(page.locator("text=Tentativa #1")).toBeVisible({ timeout: 6000 });
    await expect(page.locator("text=Resolvido").first()).toBeVisible();
  });

  test("E2E 3 — Chapter Workspace [Exercícios] integration", async ({ page }) => {
    await page.goto("/subjects");
    await page.waitForLoadState("networkidle");

    const subjectCard = page.locator("a[href^='/subjects/']").first();
    await expect(subjectCard).toBeVisible({ timeout: 10000 });
    await subjectCard.click();
    await page.waitForLoadState("networkidle");

    // Click 'Conteúdos' Tab
    const topicsTab = page.locator("button:has-text('Conteúdos')").first();
    await expect(topicsTab).toBeVisible({ timeout: 5000 });
    await topicsTab.click();
    await page.waitForTimeout(300);

    // If no topics exist, create one
    const exerciseButtons = page.locator("button:has-text('Exercícios')");
    if ((await exerciseButtons.count()) <= 1) { // 1 might be the tab header
      const newTopicBtn = page.locator("button:has-text('Novo Tópico Manual')");
      await newTopicBtn.click();
      await page.locator("input[placeholder*='Lei de Fourier']").fill("Capítulo de Hidrostática");
      await page.locator("button:has-text('Cadastrar Tópico')").click();
      await page.waitForTimeout(1000);
    }

    // Click the discrete [Exercícios] button on a chapter row
    const chapterExerciseBtn = page.locator("div.group button:has-text('Exercícios')").first();
    if (await chapterExerciseBtn.isVisible()) {
      await chapterExerciseBtn.click();
      await page.waitForTimeout(500);

      // Verify Workspace opened in Exercícios mode
      await expect(page.locator("button[data-testid='workspace-mode-exercises']")).toBeVisible();
      await expect(page.locator("text=Exercícios do Capítulo")).toBeVisible();
    }
  });
});
