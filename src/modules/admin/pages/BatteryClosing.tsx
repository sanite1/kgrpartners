import ClosingSheetPage from "../components/closing/ClosingSheetPage";

// the main yard evening sheet; the Muh'd & Kamila house one is its own tab
export default function BatteryClosing() {
  return (
    <ClosingSheetPage
      sheet="main"
      pageTitle="Battery Closing | KGR Console"
      eyebrow="END OF DAY"
      title="Battery Closing Report"
      subtitle="Every battery back at a yard tonight, its charge and voltage."
      countLabel="BATTERIES AT YARD"
    />
  );
}
