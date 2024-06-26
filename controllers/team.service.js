const boom = require("@hapi/boom");
const { Team } = require("../db/models/models");
const { Types } = require("mongoose");

class TeamService {
	constructor() {}

	async find() {
		try {
			return await Team.find()
				.populate({
					path: "members",
					model: "User",
					select: "-password",
				})
				.populate("representative", "-password");
		} catch (error) {
			throw boom.badImplementation();
		}
	}

	async create(data) {
		const team = await Team.create(data);
		return team;
	}

	async findById(id) {
		const team = await Team.findById(id)
			.populate({
				path: "members",
				model: "User",
				select: "-password",
			})
			.populate("representative", "-password");

		if (!team) throw boom.notFound();

		return team;
	}

	async updateById(id, data) {
		const team = await Team.findById(id);

		if (!team) throw boom.notFound();

		for (const field in data) {
			if (data[field] !== undefined) {
				if (field === "representative") {
					// remove if new representative is present
					team.members = team.members.filter((userId) => {
						userId !== data[field];
					});

					//move representative to members
					team.members.push(team.representative);
				}

				team[field] = data[field];
			}
		}

		await team.save();
		return team;
	}

	async addMember(team, member) {
		if (team.members.includes(member) || team.representative == member) return;

		team.members.push(member);
	}

	async addMembers(id, members) {
		const team = await Team.findById(id);

		if (!team) throw boom.notFound();

		members.forEach((m) => this.addMember(team, m));

		await team.save();

		return Team.findById(id)
			.populate({
				path: "members",
				model: "User",
				select: "-password",
			})
			.populate("representative", "-password");
	}

	async removeMember(team, member) {
		if (!team.members.length) return;

		if (!team.members.includes(member)) return;

		team.members = team.members.filter((m) => m != member);
	}

	async removeMembers(id, members) {
		const team = await Team.findById(id);

		if (!team) throw boom.notFound();

		members.forEach((m) => this.removeMember(team, m));

		await team.save();
		return Team.findById(id)
			.populate({
				path: "members",
				model: "User",
				select: "-password",
			})
			.populate("representative", "-password");
	}

	async findTeamsByMemberId(memberId) {
		const teams = await Team.find({
			$or: [{ members: { $in: [memberId] } }, { representative: memberId }],
		})
			.populate({
				path: "members",
				model: "User",
				select: "-password",
			})
			.populate("representative", "-password");

		return teams;
	}

	async deleteTeam(teamId) {
		try {
			const deletedTeam = await Team.findByIdAndDelete(teamId);
			return deletedTeam;
		} catch (err) {
			throw boom.notFound();
		}
	}
}

module.exports = TeamService;
