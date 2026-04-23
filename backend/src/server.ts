import { getConfig } from "./core/config/env.js";
import { createApp } from "./app.js";

const config = getConfig();
const app = createApp();

app.listen(config.port, () => {
  console.log(`Money Multiplier API running on http://localhost:${config.port}`);
});
