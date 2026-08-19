import { describe, expect, it } from "vitest";
import {
  calculateTopicProgress,
  calculateMasteryAverage,
  calculateMasteryDistribution,
  calculateEstimatedRemainingStudyHours,
  buildTopicTree,
  compareTopicsNatural,
  TopicItem,
} from "@/domain/topics";

describe("Domain: Topics & Mastery Calculations", () => {
  it("should calculate progress correctly when all topics are completed", () => {
    const topics: TopicItem[] = [
      { id: "1", title: "Limites", status: "COMPLETED", masteryLevel: 4, importance: 4, orderIndex: 1 },
      { id: "2", title: "Derivadas", status: "COMPLETED", masteryLevel: 4, importance: 5, orderIndex: 2 },
    ];

    const progress = calculateTopicProgress(topics);
    expect(progress.total).toBe(2);
    expect(progress.completedCount).toBe(2);
    expect(progress.inProgressCount).toBe(0);
    expect(progress.progressPercentage).toBe(100);
  });

  it("should calculate progress correctly with mixed statuses", () => {
    const topics: TopicItem[] = [
      { id: "1", title: "Tópico 1", status: "COMPLETED", masteryLevel: 4, importance: 3, orderIndex: 1 },
      { id: "2", title: "Tópico 2", status: "IN_PROGRESS", masteryLevel: 2, importance: 3, orderIndex: 2 },
      { id: "3", title: "Tópico 3", status: "NOT_STARTED", masteryLevel: 0, importance: 3, orderIndex: 3 },
      { id: "4", title: "Tópico 4", status: "ARCHIVED", masteryLevel: 0, importance: 3, orderIndex: 4 },
    ];

    const progress = calculateTopicProgress(topics);
    expect(progress.total).toBe(3); // excludes archived
    expect(progress.completedCount).toBe(1);
    expect(progress.inProgressCount).toBe(1);
    expect(progress.notStartedCount).toBe(1);
    expect(progress.progressPercentage).toBe(33);
  });

  it("should handle empty topics list gracefully", () => {
    const progress = calculateTopicProgress([]);
    expect(progress.total).toBe(0);
    expect(progress.progressPercentage).toBe(0);

    const mastery = calculateMasteryAverage([]);
    expect(mastery.averageLevel).toBe(0);
    expect(mastery.masteryScore).toBe(0);
  });

  it("should calculate average mastery level and score correctly", () => {
    const topics: TopicItem[] = [
      { id: "1", title: "T1", status: "IN_PROGRESS", masteryLevel: 2, importance: 3, orderIndex: 1 },
      { id: "2", title: "T2", status: "COMPLETED", masteryLevel: 4, importance: 3, orderIndex: 2 },
    ];

    const mastery = calculateMasteryAverage(topics);
    expect(mastery.averageLevel).toBe(3);
    expect(mastery.masteryScore).toBe(75); // (3 / 4) * 100
  });

  it("should compute mastery distribution correctly", () => {
    const topics: TopicItem[] = [
      { id: "1", title: "T1", status: "NOT_STARTED", masteryLevel: 0, importance: 3, orderIndex: 1 },
      { id: "2", title: "T2", status: "IN_PROGRESS", masteryLevel: 1, importance: 3, orderIndex: 2 },
      { id: "3", title: "T3", status: "IN_PROGRESS", masteryLevel: 2, importance: 3, orderIndex: 3 },
      { id: "4", title: "T4", status: "IN_PROGRESS", masteryLevel: 3, importance: 3, orderIndex: 4 },
      { id: "5", title: "T5", status: "COMPLETED", masteryLevel: 4, importance: 3, orderIndex: 5 },
    ];

    const dist = calculateMasteryDistribution(topics);
    expect(dist[0]).toBe(1);
    expect(dist[1]).toBe(1);
    expect(dist[2]).toBe(1);
    expect(dist[3]).toBe(1);
    expect(dist[4]).toBe(1);
  });

  it("should calculate remaining estimated study hours correctly", () => {
    const topics: TopicItem[] = [
      { id: "1", title: "T1", status: "COMPLETED", masteryLevel: 4, importance: 3, estimatedHours: 5, orderIndex: 1 },
      { id: "2", title: "T2", status: "IN_PROGRESS", masteryLevel: 2, importance: 3, estimatedHours: 3, orderIndex: 2 },
      { id: "3", title: "T3", status: "NOT_STARTED", masteryLevel: 0, importance: 3, estimatedHours: 4, orderIndex: 3 },
    ];

    const remainingHours = calculateEstimatedRemainingStudyHours(topics);
    expect(remainingHours).toBe(7); // 3 + 4
  });

  it("should sort topics naturally by number (e.g. Capítulo 1 before Capítulo 2)", () => {
    const unordered = [
      { title: "Capítulo 10: Turbomáquinas" },
      { title: "Capítulo 2: Conceitos Fundamentais" },
      { title: "Capítulo 1: Apresentação e Introdução" },
    ];

    const sorted = [...unordered].sort(compareTopicsNatural);
    expect(sorted[0].title).toBe("Capítulo 1: Apresentação e Introdução");
    expect(sorted[1].title).toBe("Capítulo 2: Conceitos Fundamentais");
    expect(sorted[2].title).toBe("Capítulo 10: Turbomáquinas");
  });

  it("should build hierarchical tree correctly with subtopics", () => {
    const topics: TopicItem[] = [
      { id: "p1", title: "Módulo 1: Fenômenos", status: "NOT_STARTED", masteryLevel: 0, importance: 3, orderIndex: 1 },
      { id: "c1", parentId: "p1", title: "1.1 Condução", status: "COMPLETED", masteryLevel: 4, importance: 3, orderIndex: 2 },
      { id: "c2", parentId: "p1", title: "1.2 Convecção", status: "IN_PROGRESS", masteryLevel: 2, importance: 3, orderIndex: 3 },
      { id: "p2", title: "Módulo 2: Radiação", status: "NOT_STARTED", masteryLevel: 0, importance: 3, orderIndex: 4 },
    ];

    const tree = buildTopicTree(topics);
    expect(tree.length).toBe(2);
    expect(tree[0].id).toBe("p1");
    expect(tree[0].subtopics.length).toBe(2);
    expect(tree[0].subtopics[0].title).toBe("1.1 Condução");
    expect(tree[1].id).toBe("p2");
    expect(tree[1].subtopics.length).toBe(0);

    // Metrics should evaluate subtopics and leaf parent p2
    const progress = calculateTopicProgress(topics);
    expect(progress.total).toBe(3); // c1, c2, p2 (p1 is skipped because it has children)
    expect(progress.completedCount).toBe(1); // c1
  });
});
