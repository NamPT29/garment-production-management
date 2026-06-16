export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  findMany(args = {}) {
    return this.model.findMany(args);
  }

  findUnique(args) {
    return this.model.findUnique(args);
  }

  create(args) {
    return this.model.create(args);
  }

  update(args) {
    return this.model.update(args);
  }

  delete(args) {
    return this.model.delete(args);
  }
}
