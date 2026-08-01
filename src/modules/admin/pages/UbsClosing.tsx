import ClosingSheetPage from "../components/closing/ClosingSheetPage";

// same format as the battery closing report, kept as its own list
// because different people take this one
export default function UbsClosing() {
  return (
    <ClosingSheetPage
      sheet="ubs"
      pageTitle="UBS | KGR Console"
      eyebrow="END OF DAY"
      title="UBS"
      subtitle="The UBS closing report: every battery there tonight, its charge and voltage."
      countLabel="BATTERIES AT UBS"
      locations={["ubs"]}
      defaultLocation="ubs"
    />
  );
}
