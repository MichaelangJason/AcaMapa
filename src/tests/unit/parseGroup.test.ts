import type { ReqGroup } from "@/types/local";
import { parseGroup, findCourseIds } from "@/lib/course";
import { GroupType } from "@/lib/enums";

describe("Find Course Id in Raw Strings", () => {
  test("Standard Pattern: ABCD123", () => {
    const raw = "ABCD 123, poiu11, xyzw  856, mnb456, m1m23j1";
    const courseIds = findCourseIds(raw, { format: true });

    expect(courseIds).toEqual(["abcd123", "xyzw856"]);
  });

  test("Multi-Term Pattern: ABCD000D1/D2/D3", () => {
    const raw = "ABCD 095D2/J1/C3, XYZW722P1";
    const courseIds = findCourseIds(raw, { format: true });

    expect(courseIds).toEqual([
      "abcd095d2",
      "abcd095j1",
      "abcd095c3",
      "xyzw722p1",
    ]);
  });

  test("Alternative Pattern: ABCD/XYZW 000", () => {
    const raw = "ABCD/XYZW 000, PLAF/NVHA 566D1";
    const courseIds = findCourseIds(raw, { format: true });

    expect(courseIds).toEqual(["abcd000", "xyzw000", "plaf566d1", "nvha566d1"]);
  });

  test("Mixing Patterns", () => {
    const raw = "ABCD 123, XYZW566U1/E2/G3, PLKJ/BHUD 582D2";
    const courseIds = findCourseIds(raw, { format: true });

    expect(courseIds).toEqual([
      "abcd123",
      "xyzw566u1",
      "xyzw566e2",
      "xyzw566g3",
      "plkj582d2",
      "bhud582d2",
    ]);
  });
});

describe("Parsing Basic Groups", () => {
  test("EMPTY", () => {
    const raw = "";
    const group = parseGroup(raw, { skipIdCheck: true });

    expect(group).toEqual({
      type: GroupType.EMPTY,
      inner: [],
    } as ReqGroup);
  });

  test("SINGLE", () => {
    const raw = "a";
    const group = parseGroup(raw, { skipIdCheck: true });

    expect(group).toEqual({
      type: GroupType.SINGLE,
      inner: ["a"],
    } as ReqGroup);
  });

  test("OR", () => {
    const raw = "a/b/c";
    const group = parseGroup(raw, { skipIdCheck: true });

    expect(group).toEqual({
      type: GroupType.OR,
      inner: ["a", "b", "c"],
    } as ReqGroup);
  });

  test("AND", () => {
    const raw = "a+b+c";
    const group = parseGroup(raw, { skipIdCheck: true });

    expect(group).toEqual({
      type: GroupType.AND,
      inner: ["a", "b", "c"],
    } as ReqGroup);
  });

  test("Select Two from a list (PAIR)", () => {
    const raw = "a|b|c";
    const group = parseGroup(raw, { skipIdCheck: true });

    expect(group).toEqual({
      type: GroupType.PAIR,
      inner: ["a", "b", "c"],
    } as ReqGroup);
  });

  test("X Credits from subjects (CREDITS)", () => {
    const raw = "12-abcd-bcda-cdba";
    const group = parseGroup(raw, { skipIdCheck: true });

    expect(group).toEqual({
      type: GroupType.CREDIT,
      inner: ["12", "abcd", "bcda", "cdba"],
    } as ReqGroup);
  });
});

describe("Parsing Complex Groups", () => {
  test("Simplify Nested Groups", () => {
    const raw = "(((a)))";
    const group = parseGroup(raw, { skipIdCheck: true });

    expect(group).toEqual({
      type: GroupType.SINGLE,
      inner: ["a"],
    } as ReqGroup);
  });

  test("Nested OR AND groups", () => {
    const raw = "(a+b)/(c+d)";
    const group = parseGroup(raw, { skipIdCheck: true });

    expect(group).toEqual({
      type: GroupType.OR,
      inner: [
        {
          type: GroupType.AND,
          inner: ["a", "b"],
        },
        {
          type: GroupType.AND,
          inner: ["c", "d"],
        },
      ],
    } as ReqGroup);
  });

  test("Nested Multiple Groups", () => {
    const raw = "((a+(b/c/(e)))/d)+((12-abcd-bcda-cdba)/(e+f))+((c+d)/(e|f|g))";
    const group = parseGroup(raw, { skipIdCheck: true });

    expect(group).toEqual({
      type: GroupType.AND,
      inner: [
        {
          type: GroupType.OR,
          inner: [
            {
              type: GroupType.AND,
              inner: [
                "a",
                {
                  type: GroupType.OR,
                  inner: ["b", "c", "e"],
                },
              ],
            },
            "d",
          ],
        },
        {
          type: GroupType.OR,
          inner: [
            {
              type: GroupType.CREDIT,
              inner: ["12", "abcd", "bcda", "cdba"],
            },
            {
              type: GroupType.AND,
              inner: ["e", "f"],
            },
          ],
        },
        {
          type: GroupType.OR,
          inner: [
            {
              type: GroupType.AND,
              inner: ["c", "d"],
            },
            {
              type: GroupType.PAIR,
              inner: ["e", "f", "g"],
            },
          ],
        },
      ],
    } as ReqGroup);
  });

  test("No Mixed Groups At the Same Level", () => {
    const raw = "a/b+c/d";

    expect(() => parseGroup(raw, { skipIdCheck: true })).toThrow();
  });
});
