import React from 'react';
import { useAsync } from 'react-use';

import { Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import { makeStyles } from '@material-ui/core';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import { FormikErrors } from 'formik';

import { rbacApiRef } from '../../api/RBACBackendClient';
import { PermissionsData } from '../../types';
import { getPluginsPermissionPoliciesData } from '../../utils/create-role-utils';
import { initialPermissionPolicyRowValue } from './const';
import { PermissionPoliciesFormRow } from './PermissionPoliciesFormRow';
import { RoleFormValues } from './types';

const useStyles = makeStyles(theme => ({
  permissionPoliciesForm: {
    padding: '20px',
    border: `2px solid ${theme.palette.border}`,
    borderRadius: '5px',
  },
  addButton: {
    color: theme.palette.primary.light,
  },
}));

type PermissionPoliciesFormProps = {
  permissionPoliciesRows: PermissionsData[];
  permissionPoliciesRowsError: FormikErrors<PermissionsData>[];
  setFieldValue: (
    field: string,
    value: any,
    shouldValidate?: boolean,
  ) => Promise<FormikErrors<RoleFormValues>> | Promise<void>;
  setFieldError: (field: string, value: string | undefined) => void;
  handleBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

export const PermissionPoliciesForm = ({
  permissionPoliciesRows,
  permissionPoliciesRowsError,
  setFieldValue,
  setFieldError,
  handleBlur,
}: PermissionPoliciesFormProps) => {
  const classes = useStyles();
  const rbacApi = useApi(rbacApiRef);

  const {
    value: permissionPolicies,
    loading: permissionPoliciesLoading,
    error: permissionPoliciesErr,
  } = useAsync(async () => {
    return await rbacApi.listPermissions();
  });

  const permissionPoliciesData =
    !permissionPoliciesLoading && Array.isArray(permissionPolicies)
      ? getPluginsPermissionPoliciesData(permissionPolicies)
      : undefined;

  const onChangePlugin = (plugin: string, index: number) => {
    setFieldValue(`permissionPoliciesRows[${index}].plugin`, plugin, true);
    setFieldValue(`permissionPoliciesRows[${index}].permission`, '', false);
    setFieldValue(
      `permissionPoliciesRows[${index}].policies`,
      initialPermissionPolicyRowValue.policies,
      false,
    );
  };

  const onChangePermission = (
    permission: string,
    index: number,
    policies?: string[],
  ) => {
    setFieldValue(
      `permissionPoliciesRows[${index}].permission`,
      permission,
      true,
    );
    setFieldValue(
      `permissionPoliciesRows[${index}].policies`,
      policies
        ? policies.map(p => ({ policy: p, effect: 'allow' }))
        : initialPermissionPolicyRowValue.policies,
      false,
    );
  };

  const onChangePolicy = (
    isChecked: boolean,
    policyIndex: number,
    index: number,
  ) => {
    setFieldValue(
      `permissionPoliciesRows[${index}].policies[${policyIndex}].effect`,
      isChecked ? 'allow' : 'deny',
      true,
    );
  };

  const onRowRemove = (index: number) => {
    const finalPps = permissionPoliciesRows.filter(
      (_pp, ppIndex) => index !== ppIndex,
    );
    setFieldError(`permissionPoliciesRows[${index}]`, undefined);
    setFieldValue('permissionPoliciesRows', finalPps, false);
  };

  const onRowAdd = () =>
    setFieldValue(
      'permissionPoliciesRows',
      [...permissionPoliciesRows, initialPermissionPolicyRowValue],
      false,
    );

  return (
    <div>
      <FormHelperText>
        Permission policies can be selected for each plugin. You can add
        multiple permission policies using +Add option.
      </FormHelperText>
      <br />
      {permissionPoliciesLoading ? (
        <Progress />
      ) : (
        <div className={classes.permissionPoliciesForm}>
          {permissionPoliciesRows.map((pp, index) => (
            <PermissionPoliciesFormRow
              key={index}
              permissionPoliciesRowError={
                permissionPoliciesRowsError?.[index] ?? {}
              }
              rowName={`permissionPoliciesRows[${index}]`}
              permissionPoliciesRowData={pp}
              permissionPoliciesData={permissionPoliciesData}
              rowCount={permissionPoliciesRows.length}
              onChangePlugin={(plugin: string) => onChangePlugin(plugin, index)}
              onChangePermission={(permission: string, policies?: string[]) =>
                onChangePermission(permission, index, policies)
              }
              onChangePolicy={(isChecked: boolean, policyIndex: number) =>
                onChangePolicy(isChecked, policyIndex, index)
              }
              onRemove={() => onRowRemove(index)}
              handleBlur={handleBlur}
              getPermissionDisabled={(permission: string) => {
                const pluginPermissionPolicies = permissionPoliciesRows.filter(
                  ppr => ppr.plugin === pp.plugin,
                );
                return !!pluginPermissionPolicies.find(
                  ppp => ppp.permission === permission,
                );
              }}
            />
          ))}
          <Button
            className={classes.addButton}
            size="small"
            onClick={onRowAdd}
            name="add-permission-policy"
          >
            <AddIcon />
            Add
          </Button>
        </div>
      )}
      {!permissionPoliciesLoading &&
        (permissionPoliciesErr?.message ||
          !Array.isArray(permissionPolicies)) && (
          <>
            <br />
            <FormHelperText error>
              {`Error fetching the permission policies: ${
                permissionPoliciesErr?.message ||
                (permissionPolicies as Response)?.statusText
              }`}
            </FormHelperText>
          </>
        )}
    </div>
  );
};
