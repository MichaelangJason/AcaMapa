export const splitCourseIds = (val: string[]) => {
  const pattern = /^[a-zA-Z]{4}\d{3}([djnDJN][1-3])?$/;

  const { courseIds, notes } = val.reduce(
    (acc, val) => {
      if (pattern.test(val)) {
        acc.courseIds.push(val);
      } else {
        acc.notes.push(val);
      }
      return acc;
    },
    { courseIds: [] as string[], notes: [] as string[] },
  );

  return { courseIds, notes };
};

export const getSubjectCode = (courseId: string) => {
  return courseId.slice(0, 4);
};

export const getCourseLevel = (courseId: string) => {
  return courseId.charAt(4);
};

// REVIEW: may need further refactoring
// match all course ids, excluding the ones with all uppercase letters
const pattern =
  /((?!(fall|lent))[A-Z0-9]{4}(( )*(\/|or)( )*[A-Z0-9]{4})?(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?((,)?( )*\d{3}([A-Z]\d(\/[A-Z]\d)*)?)*)/gi;
// match multiterm course ids like COMP 361D1/D2
const multitermPattern = /([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)+))/i;
// match alternative course ids like NRSC/BIOL 451
const alternativePattern =
  /([A-Z0-9]{4}( )*(\/|or)( )*[A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?)/gi;
// match consecutive course id that shares department code like comp 579,550,330
const consecutivePattern =
  /([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?((,)?( )*\d{3}([A-Z]\d(\/[A-Z]\d)*)?)+)/i;

export const findCourseIds = (
  raw: string,
  findAll: boolean,
  log: boolean = false,
) => {
  // find all course ids in the string that match the pattern
  let results: string[] = (raw.match(pattern) as string[]) || [];
  if (!findAll) results = results.slice(0, 1);

  results =
    results?.reduce((acc, id) => {
      id = id.replace(/-/i, " ").replace(/ ( )*/i, " ");

      // map multiterm course ids to separate course ids
      if (id.match(multitermPattern)) {
        if (log) console.log("multitermPattern: ", id);
        const prefix = id.slice(0, 4);
        const terms = id.slice(4);
        const suffix = terms.split("/");
        suffix.forEach((s, i) => {
          if (i === 0) {
            acc.push(prefix + s);
          } else {
            const baseNumber = suffix[0].slice(0, -2);
            acc.push(prefix + baseNumber + s);
          }
        });
      } else if (id.match(alternativePattern)) {
        if (log) console.log("alternativePattern: ", id);
        const prefix = id.replace(/( )*or( )*/gi, "/").slice(0, 4);
        const suffix = id.replace(/( )*or( )*/gi, "/").slice(4);
        prefix.split("/").forEach((p) => {
          acc.push(p + suffix);
        });
      } else if (id.match(consecutivePattern)) {
        if (log) console.log("consecutivePattern: ", id);
        // const [prefix, ...rest] = id.replace(/( )*,( )*/ig, " ").split(" ");
        const prefix = id.replace(/( )*or( )*/gi, "/").slice(0, 4);
        const rest = id
          .replace(/( )*or( )*/gi, "/")
          .slice(4)
          .split(",");

        rest.forEach((r) => {
          if (log) console.log("inner: ", r);
          r = r.replace(",", "").trim();

          if (r.match(/\d{3}[A-Z]\d(\/[A-Z]\d)+/gi)) {
            if (log) console.log("inner multitermPattern: ", r);
            const suffix = r.split("/");

            suffix.forEach((s, i) => {
              if (i === 0) {
                acc.push(prefix + s);
              } else {
                const baseNumber = suffix[0].slice(0, -2);
                acc.push(prefix + baseNumber + s);
              }
            });
          } else {
            acc.push(prefix + r);
          }
        });
      } else {
        // console.log("no pattern: ", id);
        acc.push(id);
      }

      return acc;
    }, [] as string[]) || [];

  return [...new Set(results)]; // remove duplicates
};
