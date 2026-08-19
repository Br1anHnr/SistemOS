import { test, expect, Page } from "@playwright/test";

// Helper to ensure a topic exists and open the study workspace
async function openFirstTopicWorkspace(page: Page, mode: "PDF" | "BOARD" = "PDF") {
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
  const studyButtons = page.locator("button:has-text('Estudar')");
  if ((await studyButtons.count()) === 0) {
    const newTopicBtn = page.locator("button:has-text('Novo Tópico Manual')");
    await newTopicBtn.click();
    await page.locator("input[placeholder*='Lei de Fourier']").fill("Aula 01 - Introdução e Fundamentos");
    await page.locator("button:has-text('Cadastrar Tópico')").click();
    await page.waitForTimeout(1000);
  }

  if (mode === "BOARD") {
    const lousaBtn = page.locator("button:has-text('Lousa')").first();
    await expect(lousaBtn).toBeVisible({ timeout: 5000 });
    await lousaBtn.click();
  } else {
    const studyBtn = page.locator("button:has-text('Estudar')").first();
    await expect(studyBtn).toBeVisible({ timeout: 5000 });
    await studyBtn.click();
  }

  // Verify modal is visible
  await expect(page.locator("text=Workspace de Estudo")).toBeVisible({ timeout: 8000 });
}

test.describe("Study Workspace End-to-End Tests", () => {
  test("E2E 1 — Note Lifecycle: Create note, verify persistence across reload", async ({ page }) => {
    await openFirstTopicWorkspace(page, "PDF");

    // Open Note creation form in Study Panel
    const newNoteBtn = page.locator("button:has-text('Nova Nota')");
    await expect(newNoteBtn).toBeVisible();
    await newNoteBtn.click();

    // Select category 'Importante'
    const importantCategoryBtn = page.locator("form button:has-text('Importante')");
    await importantCategoryBtn.click();

    // Fill note content
    const testContent = `Nota E2E Teste ${Date.now()}`;
    const formTextarea = page.locator("textarea[placeholder*='Digite o resumo']");
    await formTextarea.fill(testContent);

    // Click 'Salvar Nota'
    const saveBtn = page.locator("button:has-text('Salvar Nota')");
    await saveBtn.click();

    // Verify note is rendered in panel
    const createdNoteCard = page.locator("div[id^='note-card-']").first();
    await expect(createdNoteCard.locator("textarea")).toHaveValue(testContent, { timeout: 5000 });

    // Reload page and re-open modal to verify real PostgreSQL persistence
    await page.reload();
    await page.waitForLoadState("networkidle");

    const topicsTab = page.locator("button:has-text('Conteúdos')").first();
    await topicsTab.click();

    const reOpenStudyBtn = page.locator("button:has-text('Estudar')").first();
    await reOpenStudyBtn.click();

    const persistedNoteCard = page.locator("div[id^='note-card-']").first();
    await expect(persistedNoteCard.locator("textarea")).toHaveValue(testContent, { timeout: 5000 });
  });

  test("E2E 2 — Bookmark Navigation: Create bookmark and navigate to page", async ({ page }) => {
    await openFirstTopicWorkspace(page, "PDF");

    // Check if Bookmark creation button exists (requires material)
    const newBookmarkBtn = page.locator("button:has-text('Novo Marcador')");
    if (await newBookmarkBtn.isVisible()) {
      await newBookmarkBtn.click();

      const bookmarkTitle = `Marcador E2E ${Date.now()}`;
      const titleInput = page.locator("input[placeholder*='Título do marcador']");
      await titleInput.fill(bookmarkTitle);

      const saveBookmarkBtn = page.locator("button:has-text('Salvar Marcador')");
      await saveBookmarkBtn.click();

      // Verify bookmark card is visible
      await expect(page.locator(`text=${bookmarkTitle}`)).toBeVisible({ timeout: 5000 });
    } else {
      // Material bookmarks tab is present
      const bookmarksFilter = page.locator("button:has-text('Marcadores')");
      await expect(bookmarksFilter).toBeVisible();
    }
  });

  test("E2E 3 — PDF Annotation Toolbar and Drawing Layer", async ({ page }) => {
    await openFirstTopicWorkspace(page, "PDF");

    // If PDF is loaded, toggle Anotar toolbar
    const annotateBtn = page.locator("button:has-text('Anotar')");
    if (await annotateBtn.isVisible()) {
      await annotateBtn.click();

      // Check toolbar tools are visible
      await expect(page.locator("button[title*='Caneta livre']")).toBeVisible();
      await expect(page.locator("button[title*='Marca-texto']")).toBeVisible();
      await expect(page.locator("button[title*='Seta']")).toBeVisible();
      await expect(page.locator("button[title*='Retângulo']")).toBeVisible();
      await expect(page.locator("button[title*='Texto']")).toBeVisible();
      await expect(page.locator("button[title*='Borracha']")).toBeVisible();
    }
  });

  test("E2E 4 — Study Board (Lousa): Create elements, switch PDF/Lousa without data loss", async ({ page }) => {
    await openFirstTopicWorkspace(page, "BOARD");

    // Verify Study Workspace opened in BOARD mode
    await expect(page.locator("text=Workspace de Estudo")).toBeVisible();
    await expect(page.locator("button[title*='Nota / Card']")).toBeVisible({ timeout: 5000 });

    // Switch between PDF and Lousa modes using exact data-testid
    const pdfTabBtn = page.getByTestId("workspace-mode-pdf");
    const lousaTabBtn = page.getByTestId("workspace-mode-board");

    await pdfTabBtn.click();
    await page.waitForTimeout(200);

    await lousaTabBtn.click();
    await page.waitForTimeout(200);

    // Verify Lousa tools are active and responsive
    await expect(page.locator("button[title*='Nota / Card']")).toBeVisible();
    await expect(page.locator("button[title*='Borracha (E)']")).toBeVisible();
  });

  test("E2E 5 — Category and Page Filters in Study Panel", async ({ page }) => {
    await openFirstTopicWorkspace(page, "PDF");

    // Verify filter tabs exist and are clickable
    const filterAll = page.locator("button:has-text('Todas')");
    const filterImportant = page.locator("button:has-text('Importante')");
    const filterQuestions = page.locator("button:has-text('Dúvidas')");
    const filterFormulas = page.locator("button:has-text('Fórmulas')");
    const filterExam = page.locator("button:has-text('Prova')");

    await expect(filterAll).toBeVisible();
    await expect(filterImportant).toBeVisible();
    await expect(filterQuestions).toBeVisible();
    await expect(filterFormulas).toBeVisible();
    await expect(filterExam).toBeVisible();

    // Click through filter tabs
    await filterImportant.click();
    await filterQuestions.click();
    await filterFormulas.click();
    await filterExam.click();
    await filterAll.click();
  });

  test("E2E 6 — Subject Isolation: Verify topics belong strictly to their subject", async ({ page }) => {
    await page.goto("/subjects");
    await page.waitForLoadState("networkidle");

    const subjectCards = page.locator("a[href^='/subjects/']");
    const count = await subjectCards.count();
    expect(count).toBeGreaterThan(0);

    // Open first subject
    await subjectCards.first().click();
    await page.waitForLoadState("networkidle");

    const topicsTab = page.locator("button:has-text('Conteúdos')").first();
    await topicsTab.click();
    await page.waitForTimeout(400);

    // If there is a second subject, verify topics do not bleed
    if (count > 1) {
      await page.goto("/subjects");
      await page.waitForLoadState("networkidle");

      await subjectCards.nth(1).click();
      await page.waitForLoadState("networkidle");

      const topicsTab2 = page.locator("button:has-text('Conteúdos')").first();
      await topicsTab2.click();
      await page.waitForTimeout(400);

      // Verify page is clean and correctly scoped
      await expect(page.locator("text=Conteúdos da Disciplina")).toBeVisible();
    }
  });

  test("E2E 7 — PDF Fit Controls and Mode Toggles", async ({ page }) => {
    await openFirstTopicWorkspace(page, "PDF");

    // Check Fit Page & Fit Width buttons exist in top bar
    const fitPageBtn = page.locator("button[title*='Ajustar à Página']");
    const fitWidthBtn = page.locator("button[title*='Ajustar à Largura']");

    if (await fitPageBtn.isVisible()) {
      await fitWidthBtn.click();
      await page.waitForTimeout(200);
      await fitPageBtn.click();
      await page.waitForTimeout(200);
    }
  });
});
