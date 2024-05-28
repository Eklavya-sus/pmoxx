import { newModel, StringAdapter } from "casbin";

export const model = newModel(`
  [request_definition]
  r = sub, obj, act

  [policy_definition]
  p = sub, obj, act

  [role_definition]
  g = _, _

  [policy_effect]
  e = some(where (p.eft == allow))

  [matchers]
  m = g(r.sub, p.sub) && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)
`);

export const adapter = new StringAdapter(`
  p, admin, project, (create)|(edit)|(delete)|(show)|(list)
  p, admin, task, (create)|(edit)|(delete)|(show)|(list)
  p, admin, inventory, (create)|(edit)|(delete)|(show)|(list)
  p, admin, documents, (create)|(edit)|(delete)|(show)|(list)
  p, admin, attendance, (create)|(read)|(update)|(delete)|(list)
  p, admin, administration, (create)|(read)|(update)|(delete)|(list)
  p, admin, settings, (create)|(read)|(update)|(delete)|(list)

  p, employee, project, (show)|(list)
  p, employee, task, (show)|(list)
`);