class Model {

    constructor(user, params)
    {
        this.user = user;
        this.params = params;
        this.isPrepared = false;
    }

    async prepare()
    {
        if (this.isPrepared)
            return this.isPrepared;

        return this.isPrepared = true;
    }

    async execute()
    {
        await this.prepare();

        return {"error": false};
    }
}

module.exports = Model;