import { useEffect, useState } from "react";
import { projectAtom } from "../state.ts";
import { useAtom } from "jotai";
import { BundleNested, InlangProject, updateBundleNested, selectBundleNested } from "@inlang/sdk2";
import SingleDiffBundle from "./SingleDiffBundle.tsx";
import { SlButton } from "@shoelace-style/shoelace/dist/react";

const DiffBundleView = (props: { changes: any[]; bundleId: string }) => {
	const [project] = useAtom(projectAtom);
	const [bundle, setBundle] = useState<BundleNested | undefined>(undefined);
	const [oldBundle, setOldBundle] = useState<BundleNested | undefined>(
		undefined
	);

	useEffect(() => {
		if (!project) return;
		queryNewBundle(project, props, setBundle, setOldBundle);
		const interval = setInterval(async () => {
			await queryNewBundle(project, props, setBundle, setOldBundle);
		}, 1000);
		return () => clearInterval(interval);
	}, [project, props]);

	const handleDiscard = async () => {
		if (project && oldBundle) {
			await updateBundleNested(project?.db, oldBundle);
		}
	};

	return (
		<div className="bg-zinc-50 rounded p-4 mt-2">
			<div className="flex justify-between">
				<h3 className="font-medium text-[16px] pb-4">{props.bundleId}</h3>
				<SlButton size="small" onClick={() => handleDiscard()}>
					Discard
				</SlButton>
			</div>
			{props.changes.map((change) => (
				<p className="text-zinc-600" key={change.id}>
					<span className="font-bold text-zinc-950">You</span> changed the{" "}
					<span className="font-bold text-zinc-950">{change.type}</span> with
					the id{" "}
					<span className="font-bold text-zinc-950">{change.value?.id}</span>
				</p>
			))}

			{/* 
			* TODO unbundle
			- change `type` to `show`

			<div className="flex">
				<inlang-bundle old neu show="old">
					{messages.map((message) => {
						const previousMessage = lix.db
							.selectFrom("change")
							.where("type", "=", "message");
						return (
							<inlang-message old={previousMessage} neu={message} show="neu">
								<inlang-variant old neu show="old"></inlang-variant>
							</inlang-message>
						);
					})}
				</inlang-bundle>
				<inlang-bundle old neu show="neu">
					{messages.map((message) => {
						const previousMessage = lix.db
							.selectFrom("change")
							.where("type", "=", "message");
						return (
							<inlang-message old={previousMessage} neu={message} show="neu" editable>
								{variants.map((variant) => {
									if (pendingChange === false && variant.isRef === false){
										return ""
									}
									return <inlang-variant old neu show="neu" editable></inlang-variant>;
								})}
							</inlang-message>
						);
					})}
				</inlang-bundle>
			</div> */}
			<div className="flex gap-8">
				<div className="flex-1">
					<p className="font-medium pb-2 pt-4">Old:</p>
					{oldBundle && bundle && project && (
						<SingleDiffBundle
							bundle={bundle}
							oldBundle={oldBundle}
							settings={project.settings.get()}
							changes={props.changes}
							show="old"
						/>
					)}
				</div>
				<div className="flex-1">
					<p className="font-medium pb-2 pt-4">New:</p>
					{oldBundle && bundle && project && (
						<SingleDiffBundle
							bundle={bundle}
							oldBundle={oldBundle}
							settings={project.settings.get()}
							changes={props.changes}
							show="neu"
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default DiffBundleView;

const queryNewBundle = async (
	project: InlangProject,
	props: Parameters<typeof DiffBundleView>[0],
	setBundle: (bundle: BundleNested) => void,
	setOldBundle: (bundle: BundleNested) => void
) => {
	const bundle = await selectBundleNested(project.db)
		.where("bundle.id", "=", props.bundleId)
		.executeTakeFirst();

	if (bundle) {
		setBundle(bundle);
		const oldBundle = structuredClone(bundle);
		// TODO proper query
		for (const change of props.changes) {
			const latestCommitedChange = await getLatestCommitedChange(
				project,
				change
			);
			if (change && change.value && change.type === "variant") {
				for (const message of oldBundle.messages) {
					for (const variant of message.variants) {
						if (variant.id === change.value.id) {
							if (latestCommitedChange?.value?.pattern) {
								//update
								variant.pattern = latestCommitedChange.value.pattern;
								variant.match = latestCommitedChange.value.match;
							} else {
								//insert
								message.variants = message.variants.filter(
									(variant) => variant.id !== change.value.id
								);
							}
						}
					}
				}
			}
		}
		setOldBundle(oldBundle);
	}
};

const getLatestCommitedChange = async (project: InlangProject, change: any) => {
	const latestCommitedChange = await project.lix.db
		.selectFrom("change")
		.selectAll()
		.where("commit_id", "is not", null)
		.where("type", "=", "variant")
		.where((eb) => eb.ref("value", "->>").key("id"), "=", change.value?.id)
		.innerJoin("commit", "commit.id", "change.commit_id")
		.orderBy("commit.zoned_date_time desc")
		.executeTakeFirst();

	if (latestCommitedChange) {
		return latestCommitedChange;
	} else {
		return;
	}
};
