import LoginPage from "./components/LoginPage";
import { isAccountPage } from "./lib/pages";
import { useRoute } from "./state/useRoute";
import { useSession } from "./state/useSession";
import { useSkin } from "./state/useSkin";
import { useSound } from "./state/useSound";
import Workspace from "./Workspace";

/** Signed out you get the log in page; signed in (or in the demo) you get the board. */
export default function App() {
  // The look and the sound switch belong to this browser, whoever is using it.
  const skinApi = useSkin();
  const { soundOn, toggleSound } = useSound();
  const { session, preview, logIn, createAccount, startDemo, logOut } = useSession();
  const [page, go] = useRoute(session !== null);

  if (!session || isAccountPage(page)) {
    return (
      <LoginPage
        mode={page === "signup" ? "signup" : "login"}
        preview={preview}
        onModeChange={go}
        onLogIn={logIn}
        onCreateAccount={createAccount}
        onDemo={startDemo}
      />
    );
  }

  return (
    <Workspace
      key={session.kind === "account" ? session.email : "demo"}
      session={session}
      onLogOut={() => {
        logOut();
        go("login");
      }}
      view={page}
      onViewChange={go}
      skinApi={skinApi}
      sound={{ on: soundOn, onToggle: toggleSound }}
    />
  );
}
