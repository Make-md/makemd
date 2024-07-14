import { resultForFilters } from "core/utils/commands/filter";
import { isArray } from "lodash";
import { Superstate } from "makemd-core";
import { safelyParseJSON } from "utils/parsers";
import { ActionInstance, ActionTree } from "../../types/actions";

export const parseActionString = (actionString: string): ActionTree => {
  return safelyParseJSON(actionString);
};

export const runActionString = async (
  superstate: Superstate,
  actionString: string,
  instance?: ActionInstance
): Promise<any> => {
  const actionTree = parseActionString(actionString);
  return runActionTree(superstate, actionTree, instance);
};

export const runActionTree = async (
  superstate: Superstate,
  actionTree: ActionTree,
  instance: ActionInstance
): Promise<any> => {
  if (instance.iterations > superstate.settings.actionMaxSteps) {
    alert("Max steps reached, you can change this in settings.");
    return;
  }
  const newInstance  : ActionInstance= {
    ...instance,
    iterations: instance.iterations + 1,
    props: {
      ...(actionTree?.props ?? {}),
      ...Object.keys(actionTree.linked ?? {}).reduce(
        (p, c) => ({ ...p, [c]: instance.instanceProps[actionTree.linked[c]] }),
        {}
      ),
      ...(actionTree.result ? { [actionTree.result]: instance.result } : {}),
    },
  };
  const action = superstate.cli.commandForAction(actionTree.action);
  if (action.schema.type == "builtin") {
    if (action.schema.id == "loop" && isArray(instance.result)) {
      const loopResults = await Promise.all(
        instance.result.map((item) =>
          Promise.all(
            actionTree.children.map((child) =>
              runActionTree(superstate, child, resultInstance)
            )
          ).then((results) => results[results.length - 1])
        )
      );
      return loopResults;
    }

    if (action.schema.id == "filter") {
      const result = resultForFilters(
        actionTree.props.$function,
        newInstance.instanceProps
      );
      if (!result) {
        return;
      }
    }
  }
  let result;
  try {
    if (action.schema.type == 'api') {
      const [namespace, method] = action.schema.id.split('.')
      result = await (superstate.api as {[key: string]: any})[namespace]?.[method]?.(...action.fields.map(f => newInstance.props[f.name]));
    } else {

      result = await superstate.cli.runCommand(
        actionTree.action,
        newInstance
      );
    }
  } catch (e) {
    console.error(e);
  }
  const resultInstance = {
    ...newInstance,
    result,
  };
  if (actionTree.children?.length === 0) return result;

  const childrenResults = await Promise.all(
    actionTree.children.map((child) =>
      runActionTree(superstate, child, resultInstance)
    )
  );
  return childrenResults[childrenResults.length - 1];
};
