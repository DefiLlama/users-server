import sql from "./../utils/db";

// TODO: move to lambda.
const fetchFunctionCalls = async ({
  chain,
  address,
  functionNames,
  blocks,
}) => {
  address = Buffer.from(address.slice(2), "hex");

  return (
    await sql`
    SELECT 
      array_agg("user") as "users"
    FROM (
      SELECT
        concat('0x', encode(from_address, 'hex')) as "user"
      FROM
        ${sql(chain)}.transactions
      WHERE
        input_function_name IN ${sql(functionNames)}
        AND to_address = ${address}
    ) as _
  `
  )[0].users; ///*  AND block_number IN ${sql(blocks)} */
};

export { fetchFunctionCalls };
