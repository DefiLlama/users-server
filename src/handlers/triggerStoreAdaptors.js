import { runAdaptor } from "../utils/adaptor";
import getAdaptors from "../utils/adaptorData";
import wrap from "../utils/wrap";

export default wrap(async (event) => {
  const adaptors = await getAdaptors();

  // By using yesterday, it means user metrics are finalized i.e no more blocks
  // means no more users can interact with the contract on that day.
  const yesterday = new Date(Date.now() - 864e5);

  const res = await Promise.allSettled(
    Object.keys(adaptors).map((adaptor) =>
      runAdaptor(adaptor, yesterday, { storeData: true, ignoreChainRugs: true })
    )
  );

  console.log(res);
  console.log(res.length, Object.keys(adaptors).length);
});
