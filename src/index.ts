import express from "express";
import businessDaysRouter from "./routes/businessDays";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
// Serve static UI from public/ so the root shows the demo page
app.use(express.static('public'));
app.use("/business-days", businessDaysRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
