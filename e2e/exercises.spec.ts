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

  test("E2E 2 — Quick Exercise Creation without title and Card text preview", async ({ page }) => {
    await openSubjectExercisesTab(page);

    // Open Novo Exercício Modal
    const novoExBtn = page.locator("button:has-text('Novo Exercício')").first();
    await expect(novoExBtn).toBeVisible({ timeout: 5000 });
    await novoExBtn.click();

    // Fill only Reference and Statement (no custom title)
    const uniqueRef = `Q-${Math.floor(Math.random() * 899 + 100)}`;
    const uniqueStatement = `Calcule o gradiente de pressão no fluido incompressível ${Date.now()}`;
    await page.locator("input[placeholder*='Ex: Q01']").fill(uniqueRef);
    await page.locator("textarea[placeholder*='Escreva o texto do problema']").fill(uniqueStatement);

    // Submit
    const submitBtn = page.locator("button:has-text('Cadastrar Exercício')");
    await submitBtn.click();
    await page.waitForTimeout(600);

    // Switch to 'Todos' view to see the card
    const todosTabBtn = page.locator("button:has-text('Todos')").first();
    await todosTabBtn.click();
    await page.waitForTimeout(300);

    // Verify card shows reference number, derived title and statement snippet
    await expect(page.locator(`text=${uniqueRef}`).first()).toBeVisible({ timeout: 6000 });
    await expect(page.locator(`text=${uniqueStatement}`).first()).toBeVisible();
    await expect(page.locator("text=Resolver").first()).toBeVisible();
  });

  test("E2E 3 — Register Resolution, Verify 'Ver resolução' CTA on Card & Large Resolution View", async ({ page }) => {
    await openSubjectExercisesTab(page);

    // Switch to 'Todos' view
    const todosTabBtn = page.locator("button:has-text('Todos')").first();
    await todosTabBtn.click();
    await page.waitForTimeout(300);

    // Click on the first exercise card (Resolver)
    const exerciseCard = page.locator("button:has-text('Resolver')").first();
    await expect(exerciseCard).toBeVisible({ timeout: 6000 });
    await exerciseCard.click();
    await page.waitForTimeout(400);

    // Verify modal is open and shows Enunciado in highlight
    await expect(page.locator("text=Enunciado da Questão")).toBeVisible();
    await expect(page.locator("text=Minha Resolução")).toBeVisible();

    // Click Registrar Resolução
    const registrarBtn = page.locator("button:has-text('Registrar Resolução')").first();
    await registrarBtn.click();
    await page.waitForTimeout(300);

    // Select 'Acertei' result and add note
    const acerteiBtn = page.locator("button:has-text('Acertei')").first();
    await acerteiBtn.click();
    await page.locator("textarea[placeholder*='Cuidado com a conversão']").fill("Resolução direta aplicando a lei de Stevin.");

    // Save Resolution
    const salvarBtn = page.locator("button:has-text('Salvar Resolução')");
    await salvarBtn.click();
    await page.waitForTimeout(600);

    // Verify latest resolution is displayed in the detail modal
    await expect(page.locator("text=Última Resolução")).toBeVisible({ timeout: 6000 });
    await expect(page.locator("text=Acertei").first()).toBeVisible();

    // Close detail modal
    await page.locator("button:has-text('✕')").first().click();
    await page.waitForTimeout(400);

    // Verify card now shows 'Ver resolução' CTA and 'Resolvido' status
    await expect(page.locator("button:has-text('Ver resolução')").first()).toBeVisible();
    await expect(page.locator("text=Resolvido").first()).toBeVisible();
  });

  test("E2E 4 — Register Second Attempt (Nova Tentativa) and verify recent focus & collapsible history", async ({ page }) => {
    await openSubjectExercisesTab(page);

    // Switch to 'Todos' view
    const todosTabBtn = page.locator("button:has-text('Todos')").first();
    await todosTabBtn.click();
    await page.waitForTimeout(300);

    // Open an exercise that has a resolution
    const verResolucaoBtn = page.locator("button:has-text('Ver resolução')").first();
    await expect(verResolucaoBtn).toBeVisible({ timeout: 6000 });
    await verResolucaoBtn.click();
    await page.waitForTimeout(400);

    // Click 'Nova Tentativa' inside the open exercise modal
    const novaTentativaBtn = page.locator(".fixed.z-50 button:has-text('Nova Tentativa')").first();
    await expect(novaTentativaBtn).toBeVisible();
    await novaTentativaBtn.click();
    await page.waitForTimeout(300);

    // Select 'Parcial' result
    const parcialBtn = page.locator("button:has-text('Parcial')").first();
    await parcialBtn.click();
    await page.locator("textarea[placeholder*='Cuidado com a conversão']").fill("Segunda tentativa: esqueci a densidade relativa.");

    // Save
    const salvarBtn = page.locator("button:has-text('Salvar Resolução')");
    await salvarBtn.click();
    await page.waitForTimeout(600);

    // Verify latest attempt is now Parcial
    await expect(page.locator("text=Última Resolução (Tentativa #2)")).toBeVisible({ timeout: 6000 });
    await expect(page.locator("text=Parcial").first()).toBeVisible();

    // Verify collapsible history button is visible
    const historyBtn = page.locator("button:has-text('Histórico de tentativas anteriores')");
    await expect(historyBtn).toBeVisible();
    await historyBtn.click();
    await page.waitForTimeout(200);

    // Verify previous attempt #1 is shown in history
    await expect(page.locator("text=Tentativa #1")).toBeVisible();
  });

  test("E2E 5 — Chapter Workspace [Exercícios] Integration", async ({ page }) => {
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
    if ((await exerciseButtons.count()) <= 1) {
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
      await expect(page.locator("text=Capítulo:")).toBeVisible();
    }
  });
});
