import express from "express";
import businessDaysRouter from "./routes/businessDays";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/business-days", businessDaysRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
