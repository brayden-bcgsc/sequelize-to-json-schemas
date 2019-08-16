/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

/**
 * Test runner used for Rapid Development.
 */

// ============================================================================
// Please note that we do not need an active database connection to test models.
// ============================================================================
const _ = require('lodash'); // limit later to `merge`, `capitalize`, etc.

const Sequelize = require('sequelize');

const { DataTypes } = Sequelize;
const sequelize = new Sequelize({
  dialect: 'mysql'
});

const SwaggerParser = require('swagger-parser');

// we MUST chain build() or model will be an untestable `Function` instead of a real `Sequelize.Model`
const userModel = sequelize.import("./test/models/user.js").build();

// ============================================================================
// Test the SchemaManager and strategies
// ============================================================================
const { SchemaManager, JsonSchema6Strategy, OpenApi3Strategy } = require('./lib');

// Initialize the SchemaManager with non-strategy-specific options
const schemaManager = new SchemaManager({
  baseUri: 'https://api.example.com',
});

// ----------------------------------
// Generate JSON Schema v6 schema
// ----------------------------------
const json6strategy = new JsonSchema6Strategy();
let userSchema = schemaManager.generate(userModel, json6strategy);

console.log('JSON Schema v6:')
console.log(userSchema);

// ----------------------------------
// Generate OpenAPI v3 schema
// ----------------------------------
const openapi3strategy = new OpenApi3Strategy();
userSchema = schemaManager.generate(userModel, openapi3strategy);

console.log('OpenAPI v3:');
console.log(userSchema);

// OpenApi requires more than just the model schema for validation so we insert it into the wrapper
const validationSchema = require('./test/strategies/openapi-v3/schema-validation-wrapper');

validationSchema.components.schemas.users = userSchema;
console.log('Validation schema object:');
console.log(validationSchema);

console.log('Validation schema as JSON string:');
console.log(JSON.stringify(validationSchema, null, 2));

console.log('Validating generated full schema against swagger-parser:');

async function validateSchema () {
  try {
    const api = await SwaggerParser.validate(_.cloneDeep(validationSchema));
    console.log("API name: %s, Version: %s", api.info.title, api.info.version);
  }
  catch(error) {
    console.error(error);
  }
}

validateSchema();
