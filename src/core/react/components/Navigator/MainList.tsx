import { SpaceTreeComponent } from "core/react/components/Navigator/SpaceTree/SpaceTreeView";
import { Superstate } from "core/superstate/superstate";
import { isTouchScreen } from "core/utils/ui/screen";
import React, { useEffect } from "react";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import { FocusSelector } from "./Focuses/FocusSelector";
import { MainMenu } from "./MainMenu";

export const MainList = (props: { superstate: Superstate }) => {
  const [indexing, setIndexing] = React.useState(false);
  // const [error, resetError] = useErrorBoundary();
  // if (error) props.superstate.ui.error(error);

  useEffect(() => {
    const reindex = async () => {
      setIndexing(true);
    };
    const finishedIndex = async () => {
      setIndexing(false);
    };
    props.superstate.eventsDispatcher.addListener("superstateReindex", reindex);
    props.superstate.eventsDispatcher.addListener(
      "superstateUpdated",
      finishedIndex
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "superstateReindex",
        reindex
      );
      props.superstate.eventsDispatcher.removeListener(
        "superstateUpdated",
        finishedIndex
      );
    };
  }, []);
  return (
    <>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div className="mk-progress-bar">
          {indexing && <div className="mk-progress-bar-value"></div>}
        </div>
        {!isTouchScreen(props.superstate.ui) && (
          <MainMenu superstate={props.superstate}></MainMenu>
        )}
        <FocusSelector superstate={props.superstate}></FocusSelector>

        <SpaceTreeComponent superstate={props.superstate} />
      </ErrorBoundary>
    </>
  );
};

export function ErrorFallback({ error }: { error: Error }) {
  const { resetBoundary } = useErrorBoundary();

  const copyError = () => {
    navigator.clipboard.writeText(error.message);
  };
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <p style={{ color: "red" }}>{error.message}</p>
      <button onClick={copyError}>Copy Error</button>
      <button onClick={resetBoundary}>Reload</button>
    </div>
  );
}
