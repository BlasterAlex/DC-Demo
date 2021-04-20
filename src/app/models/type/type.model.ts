export class Type {

  id!: string;
  title!: string;
  direction!: { [key: string]: { name: string, images: string[] } };
  stairways!: { [key: string]: { name: string } };

}
