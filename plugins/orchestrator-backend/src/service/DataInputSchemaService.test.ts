import { createLogger, format, transports } from 'winston';

import mockComposedGreetingWorkflowData from '../../__fixtures__/mockComposedGreetingWorfklow';
import mockGreetingWorkflowData from '../../__fixtures__/mockGreetingWorkflowData';
import mockSpringBootWorkflowData from '../../__fixtures__/mockSpringBootWorkflowData';
import { DataInputSchemaService } from './DataInputSchemaService';

const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logfile.log' }),
  ],
});
const service = new DataInputSchemaService(logger, undefined);

describe('workflow input schema response', () => {
  it('schema with refs should return multiple steps', () => {
    const response = service.getWorkflowInputSchemaResponse(
      mockSpringBootWorkflowData.workflowItem,
      mockSpringBootWorkflowData.schema,
    );
    expect(response.isComposedSchema).toEqual(true);
    expect(response.schemaSteps?.map(step => step.title)).toEqual([
      'Provide information about the new component',
      'Provide information about the Java metadata',
      'Provide information about the CI method',
    ]);
    expect(response.schemaSteps?.map(step => step.key)).toEqual([
      'newComponent',
      'javaMetadata',
      'ciMethod',
    ]);
  });

  it('schema with two layers without refs should return a schema parse error', () => {
    const response = service.getWorkflowInputSchemaResponse(
      mockSpringBootWorkflowData.workflowItem,
      { ...mockSpringBootWorkflowData.schema, $defs: undefined },
    );
    expect(response.isComposedSchema).toEqual(false);
    expect(response.schemaSteps.length).toEqual(0);
    expect(response.schemaParseError).toEqual(
      'schema contains invalid ref #/$defs/Provide information about the new component_0',
    );
  });

  it('none composed schema should return isComposedSchema false and one step', () => {
    const response = service.getWorkflowInputSchemaResponse(
      mockGreetingWorkflowData.workflowItem,
      mockGreetingWorkflowData.schema,
    );
    expect(response.isComposedSchema).toEqual(false);
    expect(response.schemaSteps[0].key).toEqual('DUMMY_KEY_FOR_SINGLE_SCHEMA');
    expect(response.schemaSteps[0].title).toEqual('Data Input Schema');
  });

  it('composed schema also wihtout refs should return multiple steps', () => {
    const response = service.getWorkflowInputSchemaResponse(
      mockComposedGreetingWorkflowData.workflowItem,
      mockComposedGreetingWorkflowData.schema,
    );
    expect(response.isComposedSchema).toEqual(true);
    expect(response.schemaSteps[0].key).toEqual('language');
    expect(response.schemaSteps[0].title).toEqual('Language');
    expect(response.schemaSteps[1].key).toEqual('name');
    expect(response.schemaSteps[1].title).toEqual('name');
  });

  it('a schema without properties should return a schema parse error', () => {
    const response = service.getWorkflowInputSchemaResponse(
      mockComposedGreetingWorkflowData.workflowItem,
      { title: 'A' },
    );
    expect(response.isComposedSchema).toEqual(false);
    expect(response.schemaSteps.length).toEqual(0);
    expect(response.schemaParseError).toEqual(
      'the provided schema does not contain valid properties',
    );
  });

  it('using initial variables should return data for each step', () => {
    const response = service.getWorkflowInputSchemaResponse(
      mockGreetingWorkflowData.workflowItem,
      mockGreetingWorkflowData.schema,
      mockGreetingWorkflowData.variables,
    );
    expect(response.isComposedSchema).toEqual(false);
    expect(response.schemaSteps[0].data).toEqual({
      language: 'Spanish',
      name: 'John Doe',
    });
    expect(response.schemaSteps[0].readonlyKeys).toEqual([]);
  });

  it('using initial variables on composed schema should return data for each step', () => {
    const response = service.getWorkflowInputSchemaResponse(
      mockComposedGreetingWorkflowData.workflowItem,
      mockComposedGreetingWorkflowData.schema,
      mockComposedGreetingWorkflowData.variables,
    );
    expect(response.isComposedSchema).toEqual(true);
    expect(response.schemaSteps[0].data).toEqual({ language: 'Spanish' });
    expect(response.schemaSteps[1].data).toEqual({ name: 'John Doe' });
    expect(response.schemaSteps[0].readonlyKeys).toEqual([]);
  });

  it('using initial assessment variables should return read only keys', () => {
    const response = service.getWorkflowInputSchemaResponse(
      mockGreetingWorkflowData.workflowItem,
      mockGreetingWorkflowData.schema,
      undefined,
      {
        workflowdata: {
          language: 'Spanish',
          name: 'John Doe',
          greeting: 'hello',
          waitOrError: 'Error',
        },
      },
    );
    expect(response.isComposedSchema).toEqual(false);
    expect(response.schemaSteps[0].data).toEqual({
      language: 'Spanish',
      name: 'John Doe',
    });
    expect(response.schemaSteps[0].readonlyKeys).toEqual(['language', 'name']);
  });
});
