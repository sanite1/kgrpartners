import ClosingSheetPage from "../components/closing/ClosingSheetPage";

// same format as the battery closing report, kept as its own list
// because different people take this one
export default function MainYardClosing() {
  return (
    <ClosingSheetPage
      sheet="main_yard"
      pageTitle="Main Yard | KGR Console"
      eyebrow="END OF DAY"
      title="Main Yard"
      subtitle="The main yard closing report: every battery there tonight, its charge and voltage."
      countLabel="BATTERIES AT MAIN YARD"
      locations={["main_yard"]}
      defaultLocation="main_yard"
    />
  );
}
