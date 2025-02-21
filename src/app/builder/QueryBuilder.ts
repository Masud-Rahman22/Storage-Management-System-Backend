import { FilterQuery, Query } from 'mongoose';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  /** ------------   SEARCH in fields by REGEX    ----------------------*/ //for searching through fields
  search(searchableFields: string[]) {
    const searchTerm = this?.query?.searchTerm;
    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          (field) =>
            ({
              [field]: { $regex: searchTerm, $options: 'i' },
            }) as FilterQuery<T>, // Use mongoose Filter query
        ),
      });
    }

    return this;
  }

  /** ------------   Filter    ----------------------*/ //exclude the fields like limit sort page number from the query
  filter() {
    const queryObj = { ...this.query }; // copy the query

    //filter and remove
    const excludableFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];

    excludableFields.map((el) => delete queryObj[el]); //delete from the obj

    // add to query by removing those field from find({}) and only with the searchquery of anything;
    this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);

    return this;
  }

  /** ------------   SORT    ----------------------*/
  sort() {
    const sort =
      (this?.query?.sort as string)?.split(',')?.join(' ') || '-createdAt';
    this.modelQuery = this.modelQuery.sort(sort as string);

    return this;
  }

  /** ------------   PAGINATION    ----------------------*/
  paginate() {
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  /** ------------   SELECTION     ----------------------*/
  fields() {
    // for select fields
    const fields =
      (this?.query?.fields as string)?.split(',')?.join(' ') || '-__v';

    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  /**---------------- To Get the meta data; ie: page, total data etc  --------------------- */
  async countTotal() {
    //20-11
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);

    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
