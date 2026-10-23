export const orgColumns = [
  "OrganizationID",
  "OrganizationName",
  "ParentOrganizationID",
  "DisplayOrder",
  "IsActive",
];
export const memberColumns = [
  "MemberID",
  "DisplayName",
  "Email",
  "Contact",
  "OrganizationID",
  "Position",
  "DisplayOrder",
  "IsActive",
];
export type Row = Record<string, unknown>;
export interface Org {
  id: string;
  name: string;
  parent: string;
  order: number;
  active: boolean;
}
export interface Member {
  key: string;
  id: string;
  name: string;
  email: string;
  contact: string;
  org: string;
  position: string;
  order: number;
  active: boolean;
}
export interface Book {
  orgs: Org[];
  members: Member[];
}
const str = (v: unknown) => String(v ?? "").trim();
function active(v: unknown) {
  if (v === true || v === 1 || str(v).toLowerCase() === "true") return true;
  if (v === false || v === 0 || str(v).toLowerCase() === "false") return false;
  throw Error("IsActive: TRUE/FALSE または 1/0 / expected boolean");
}
function order(v: unknown) {
  const n = Number(v);
  if (!str(v) || !Number.isFinite(n))
    throw Error("DisplayOrder: 数値が必要 / number required");
  return n;
}
export function tableRows(
  headers: unknown[][],
  rows: unknown[][],
  required: string[],
): Row[] {
  const h = (headers[0] ?? []).map(str);
  for (const c of required)
    if (!h.includes(c))
      throw Error(`必須列がありません / Missing column: ${c}`);
  if (new Set(h).size !== h.length)
    throw Error("列名が重複 / Duplicate headers");
  return rows
    .filter((r) => r.some((v) => str(v) !== ""))
    .map((r) => Object.fromEntries(h.map((c, i) => [c, r[i]])));
}
export function parseBook(organizations: Row[], members: Row[]): Book {
  const orgs = organizations.map((r) => ({
    id: str(r.OrganizationID),
    name: str(r.OrganizationName),
    parent: str(r.ParentOrganizationID),
    order: order(r.DisplayOrder),
    active: active(r.IsActive),
  }));
  const byId = new Map(orgs.map((o) => [o.id, o]));
  if (byId.size !== orgs.length || orgs.some((o) => !o.id || !o.name))
    throw Error(
      "組織IDの空欄・重複、または組織名が空欄 / Invalid organization ID/name",
    );
  for (const o of orgs)
    if (o.parent && !byId.has(o.parent))
      throw Error(`親組織が存在しません / Missing parent: ${o.id}`);
  // Iterative walk: no recursion depth limit, including validation of inactive branches.
  const done = new Set<string>();
  for (const o of orgs) {
    const path = new Set<string>();
    let id = o.id;
    while (id && !done.has(id)) {
      if (path.has(id)) throw Error(`循環参照 / Cycle: ${id}`);
      path.add(id);
      id = byId.get(id)!.parent;
    }
    for (const p of path) done.add(p);
  }
  const keys = new Set<string>();
  const people = members.map((r) => {
    const id = str(r.MemberID),
      org = str(r.OrganizationID),
      key = JSON.stringify([id, org]);
    if (!id || !str(r.DisplayName) || !byId.has(org) || keys.has(key))
      throw Error(`社員ID・所属の不整合 / Invalid member: ${id}`);
    keys.add(key);
    return {
      key,
      id,
      name: str(r.DisplayName),
      email: str(r.Email),
      contact: str(r.Contact),
      org,
      position: str(r.Position),
      order: order(r.DisplayOrder),
      active: active(r.IsActive),
    };
  });
  const visible = new Set<string>();
  const children = new Map<string, Org[]>();
  for (const o of orgs) {
    const a = children.get(o.parent) ?? [];
    a.push(o);
    children.set(o.parent, a);
  }
  const stack = [...(children.get("") ?? [])];
  while (stack.length) {
    const o = stack.pop()!;
    if (o.active) {
      visible.add(o.id);
      stack.push(...(children.get(o.id) ?? []));
    }
  }
  const sort = <T extends { order: number }>(a: T, b: T) => a.order - b.order;
  return {
    orgs: orgs.filter((o) => visible.has(o.id)).sort(sort),
    members: people.filter((m) => m.active && visible.has(m.org)).sort(sort),
  };
}
export function orgIds(book: Book, id: string, descendants: boolean) {
  const ids = new Set([id]);
  if (descendants) {
    const children = new Map<string, string[]>();
    for (const o of book.orgs) {
      const list = children.get(o.parent) ?? [];
      list.push(o.id);
      children.set(o.parent, list);
    }
    const stack = [id];
    while (stack.length)
      for (const child of children.get(stack.pop()!) ?? []) {
        if (!ids.has(child)) {
          ids.add(child);
          stack.push(child);
        }
      }
  }
  return ids;
}
export type SearchField = "all" | "name" | "org" | "email";
export function search(
  book: Book,
  query: string,
  field: SearchField,
  org: string,
  descendants: boolean,
) {
  const q = query.normalize("NFKC").toLocaleLowerCase().trim();
  const match = (s: string) =>
    s.normalize("NFKC").toLocaleLowerCase().includes(q);
  const scope = org ? orgIds(book, org, descendants) : null;
  const departments = new Set<string>();
  if (q && (field === "all" || field === "org"))
    for (const o of book.orgs)
      if (match(o.name))
        for (const id of orgIds(book, o.id, descendants)) departments.add(id);
  return book.members.filter(
    (m) =>
      (!scope || scope.has(m.org)) &&
      (!q ||
        departments.has(m.org) ||
        (field === "name" && match(m.name)) ||
        (field === "email" && match(m.email)) ||
        (field === "all" &&
          [m.id, m.name, m.email, m.contact, m.position].some(match))),
  );
}
export function validEmail(s: string) {
  return /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(s);
}
export function uniqueRecipients(members: Member[], existing: string[] = []) {
  const seen = new Set(existing.map((x) => x.trim().toLowerCase()));
  return members.filter((m) => {
    const key = m.email.toLowerCase();
    if (!validEmail(m.email) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function selectMembers(
  current: Set<string>,
  members: Member[],
  checked: boolean,
) {
  const next = new Set(current);
  for (const m of members)
    if (validEmail(m.email)) {
      if (checked) next.add(m.key);
      else next.delete(m.key);
    }
  return next;
}
