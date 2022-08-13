const isValidAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);

const addressToPSQLNative = (address: string) => {
  if (!isValidAddress(address))
    throw new Error(`${address} is an invalid address format`);

  return Buffer.from(address.slice(2), "hex");
};

export { addressToPSQLNative };
