import { jwt } from "../utils/index.js";

import { createGuardComponent } from "./Protected.js";

const AdminOnly = createGuardComponent(() => jwt.isAuthenticated() && jwt.isAdmin());

export default AdminOnly;

