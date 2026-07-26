import ClosingSheetPage from "../components/closing/ClosingSheetPage";

// same format as the battery closing report, kept as its own list
// because different people take this one
export default function HouseClosing() {
  return (
    <ClosingSheetPage
      sheet="muhd_kamila"
      pageTitle="Muh'd & Kamila House | KGR Console"
      eyebrow="END OF DAY"
      title="Muh'd & Kamila House"
      subtitle="The house closing report: every battery there tonight, its charge and voltage."
      countLabel="BATTERIES AT HOUSE"
    />
  );
}
