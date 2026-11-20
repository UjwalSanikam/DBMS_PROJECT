import assert from "node:assert/strict";
import type { QdrantClient } from "@qdrant/js-client-rest";
import { findStylePair } from "@/lib/qdrant-style-pair";

// Exercise query direction, filters, score inversion, distinctness and ties
// against a deterministic cosine-search fixture without changing live data.
const points = [
  {id: 1, vector: [1, 0], position: "ST"},
  {id: 2, vector: [0.99, 0.01], position: "ST"},
  {id: 3, vector: [-1, 0], position: "CB"},
  {id: 4, vector: [0, 1], position: "ST"},
];
function fixture(rows = points) {
  return {query: async (_collection: string, request: {
    query: number[]; params: {exact: boolean}; limit: number;
    filter: {must?: Array<{match: {value: string}}> ; must_not: Array<{has_id: number[]}>};
  }) => {
    assert.equal(request.params.exact, true);
    assert.equal(request.limit, 1);
    const excluded = request.filter.must_not.flatMap(c => c.has_id);
    const position = request.filter.must?.[0].match.value;
    return {points: rows.filter(p => !excluded.includes(p.id) && (!position || p.position === position))
      .map(p => ({id: p.id, score: p.vector.reduce((s,v,i) => s + v * request.query[i], 0) / (Math.hypot(...p.vector) * Math.hypot(...request.query))}))
      .sort((a,b) => b.score - a.score).slice(0,1)};
  }} as unknown as Pick<QdrantClient, "query">;
}

async function main() {
  const pair = await findStylePair(fixture(), 1, [1,0]);
  assert.deepEqual(pair?.map(p => [p.id, p.match_type]), [[2,"closest"],[3,"most_different"]]);
  assert.equal(pair?.[1].score, -1);
  const filtered = await findStylePair(fixture(), 1, [1,0], "ST");
  assert.deepEqual(filtered?.map(p => p.id), [2,4]);
  assert.equal(await findStylePair(fixture(points.slice(0,2)), 1, [1,0]), null);
  assert.equal(await findStylePair(fixture([]), 1, [1,0]), null);
  const ties = await findStylePair(fixture(points.map(p => ({...p, vector: [1,0]}))), 1, [1,0]);
  assert.equal(new Set(ties?.map(p => p.id)).size, 2);
  await assert.rejects(() => findStylePair(fixture(), 1, [0,0]));
  await assert.rejects(() => findStylePair(fixture(), 1, [NaN,0]));
  console.log("Style pair tests passed: closest, opposite, score, position, insufficient data, ties, invalid vectors.");
}
main().catch(error => {console.error(error); process.exitCode = 1;});
